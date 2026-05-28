import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from "firebase/auth";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";
import { TeamMember, HistoryMilestone, ServiceCategory, JobVacancy } from "../types";

// Fallback Default Content imported or copied directly from data.ts
import { 
  TEAM_MEMBERS as DEFAULT_TEAM, 
  HISTORY_MILESTONES as DEFAULT_HISTORY, 
  SERVICE_CATEGORIES as DEFAULT_SERVICES, 
  JOB_VACANCIES as DEFAULT_JOBS 
} from "../data";

// Initialize Firebase App safely to prevent top-level module evaluation crashes
let app: any = null;
let auth: any = null;
let storage: any = null;
try {
  const config = (firebaseConfig && typeof firebaseConfig === 'object' && 'default' in firebaseConfig) 
    ? (firebaseConfig as any).default 
    : firebaseConfig;
  app = getApps().length > 0 ? getApp() : initializeApp(config);
  auth = getAuth(app);
  storage = getStorage(app);
} catch (e: any) {
  console.error("Firebase App, Auth or Storage initialization failed:", e);
}

export { storage };

export const uploadTeamPhoto = async (file: File): Promise<string> => {
  if (!storage) {
    throw new Error("Firebase Storage ist nicht verfügbar oder die Konfiguration fehlt.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Bitte wählen Sie nur Bilddateien (JPEG/PNG) aus.");
  }
  // Max size check: 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Die Bilddatei ist zu groß (maximal 5 MB erlaubt).");
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
  const storageRef = ref(storage, `team-photos/${timestamp}_${safeName}.${fileExt}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
};

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/drive.file");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    console.warn("Firebase Auth is not initialized or failed.");
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!auth) {
    throw new Error("Firebase Auth ist nicht initialisiert. Bitte prüfen Sie die Firebase-Konfiguration.");
  }
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Fehler beim Abrufen des OAuth-Tokens von Google.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Fehler bei Google-Anmeldung:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  if (!auth) return;
  await signOut(auth);
  cachedAccessToken = null;
};

// CMS SCHEMAS & DEFAULT CMS KEY-VALUES
export interface CMSContent {
  allgemeines: Record<string, string>;
  team: TeamMember[];
  historie: HistoryMilestone[];
  dienstleistungen: ServiceCategory[];
  jobs: JobVacancy[];
}

export const DEFAULT_ALLGEMEIN: Record<string, string> = {
  contact_phone: "03378 801127",
  contact_email: "info@john-haustechnik.de",
  contact_address: "Dornweg 14, 14974 Ludwigsfelde",
  contact_hours: "Mo - Do: 07:00 - 16:30 Uhr | Fr: 07:00 - 14:00 Uhr",
  notdienst_phone: "0172 3004050",
  hero_title: "Meisterliche Haustechnik für Bad & Heizung",
  hero_subtitle: "Seit 1981 der ehrliche & verlässliche Fachbetrieb in Ludwigsfelde. Wir planen moderne Wärmepumpen, gestalten barrierefreie Bäder und reparieren dichte Rohrnetze zur vollsten Zufriedenheit.",
  experience_stat: "45 Jahre",
  success_stat: "100%"
};

const TABS = ["Allgemeines", "Dienstleistungen", "Team", "Historie", "Karriere"];

/**
 * Creates the complete structured Google Sheets CMS Template
 */
export async function createCMS_Sheet(token: string): Promise<string> {
  const fileBody = {
    properties: {
      title: "JOHN Haustechnik - Homepage CMS (Live)"
    },
    sheets: TABS.map(tab => ({
      properties: {
        title: tab,
        gridProperties: {
          frozenRowCount: 1,
          columnCount: 10
        }
      }
    }))
  };

  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(fileBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fehler beim Erstellen des CMS Sheets: ${errorText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;

  // Prepopulate the generated template sheets with existing default data
  await populateCMSDefaultData(token, spreadsheetId);

  return spreadsheetId;
}

/**
 * Packs existing website texts and transfers them in a single batchUpdate to the new Google Sheet
 */
async function populateCMSDefaultData(token: string, spreadsheetId: string) {
  // 1. Tab: Allgemeines
  const allgemeinValues = [
    ["Schlüssel", "Wert (Aktueller Inhalt)", "Beschreibung / Wo platziert?"],
    ["contact_phone", DEFAULT_ALLGEMEIN.contact_phone, "Hauptnetz-Telefonnummer der Firma John"],
    ["contact_email", DEFAULT_ALLGEMEIN.contact_email, "Offizielle Büro E-Mail-Adresse"],
    ["contact_address", DEFAULT_ALLGEMEIN.contact_address, "Firmensitz & Anschrift (Ludwigsfelde)"],
    ["contact_hours", DEFAULT_ALLGEMEIN.contact_hours, "Büro Öffnungszeiten"],
    ["notdienst_phone", DEFAULT_ALLGEMEIN.notdienst_phone, "Ausweichnummer Mobiler Kundenservice & Notfalldienst"],
    ["hero_title", DEFAULT_ALLGEMEIN.hero_title, "Haupttitel im Header (H1)"],
    ["hero_subtitle", DEFAULT_ALLGEMEIN.hero_subtitle, "Einleitungssatz im Bild-Bereich"],
    ["experience_stat", DEFAULT_ALLGEMEIN.experience_stat, "Zahl: Jahre an Erfahrung vor Ort"],
    ["success_stat", DEFAULT_ALLGEMEIN.success_stat, "Prozentsatz bzw. Qualitätsgarantie-Beschriftung"]
  ];

  // 2. Tab: Dienstleistungen
  const serviceValues = [
    ["Kategorie-ID (sanitaer / heizung / lueftung / solar)", "Kategorie-Überschrift", "Kategorie-Teaser", "Leistungs-Kollektion Titel", "Karte Beschreibung", "Leistungspunkte (mit Semikolon ; trennen)"]
  ];
  DEFAULT_SERVICES.forEach(cat => {
    cat.details.forEach((det, idx) => {
      serviceValues.push([
        cat.id,
        idx === 0 ? cat.title : "",       // Only write category title in the first row to avoid duplicates
        idx === 0 ? cat.description : "", // Only write category teaser once, leave subsequent empty
        det.title,
        det.description,
        det.bullets.join(";")
      ]);
    });
  });

  // 3. Tab: Team
  const teamValues = [
    ["Name", "Rolle / Jobbezeichnung", "Persönliches Zitat", "Biografie (Absatz)", "Dienstjahr (z.B. 1998)", "Bild-URL (Optional)"]
  ];
  DEFAULT_TEAM.forEach(t => {
    teamValues.push([
      t.name,
      t.role,
      t.quote,
      t.description,
      String(t.experienceYear),
      t.imageUrl || ""
    ]);
  });

  // 4. Tab: Historie
  const historyValues = [
    ["Jahr", "Ereignis-Überschrift", "Ausführliche Erläuterung"]
  ];
  DEFAULT_HISTORY.forEach(h => {
    historyValues.push([
      String(h.year),
      h.title,
      h.description
    ]);
  });

  // 5. Tab: Karriere
  const jobValues = [
    ["ID", "Stellenbezeichnung", "Anstellung & Typ", "Einleitungssatz", "Anforderungen (mit Semikolon ; trennen)", "Unternehmensvorteile (mit Semikolon ; trennen)"]
  ];
  DEFAULT_JOBS.forEach(j => {
    jobValues.push([
      j.id,
      j.title,
      j.type,
      j.intro,
      j.requirements.join(";"),
      j.benefits.join(";")
    ]);
  });

  const batchBody = {
    valueInputOption: "USER_ENTERED",
    data: [
      { range: "'Allgemeines'!A1:C10", values: allgemeinValues },
      { range: `'Dienstleistungen'!A1:F${serviceValues.length}`, values: serviceValues },
      { range: `'Team'!A1:F${teamValues.length}`, values: teamValues },
      { range: `'Historie'!A1:C${historyValues.length}`, values: historyValues },
      { range: `'Karriere'!A1:F${jobValues.length}`, values: jobValues }
    ]
  };

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(batchBody)
  });
}

/**
 * Dynamic content fetcher from the connected Google Sheet
 * Performs a single batchGet request to fetch content cleanly of all tabs
 */
export async function fetchCMS_Data(token: string, spreadsheetId: string): Promise<CMSContent> {
  const ranges = TABS.map(tab => `${tab}!A2:F200`).join("&ranges=");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges}`;
  
  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error("Fehler beim Abrufen der CMS-Daten aus Google Sheets.");
  }

  const result = await response.json();
  const valueRanges = result.valueRanges || [];

  // Parse each of the fetched tabs
  const parsedAllgemeines: Record<string, string> = { ...DEFAULT_ALLGEMEIN };
  const parsedTeam: TeamMember[] = [];
  const parsedHistory: HistoryMilestone[] = [];
  const parsedServices: ServiceCategory[] = [];
  const parsedJobs: JobVacancy[] = [];

  // 1. Tab: Allgemeines (Value Range Index 0)
  const allgemeinRows = valueRanges[0]?.values || [];
  allgemeinRows.forEach((row: any[]) => {
    const key = row[0];
    const value = row[1];
    if (key && value !== undefined) {
      parsedAllgemeines[key] = value;
    }
  });

  // 2. Tab: Dienstleistungen (Value Range Index 1)
  const serviceRows = valueRanges[1]?.values || [];
  // We need to re-group individual rows back into their main 4 categories:
  // sanitaer, heizung, lueftung, solar
  const categoryMap = new Map<string, ServiceCategory>();
  
  serviceRows.forEach((row: any[]) => {
    const catId = row[0];
    if (!catId) return;

    const catTitle = row[1];
    const catDesc = row[2];
    const detTitle = row[3];
    const detDesc = row[4];
    const detBulletsStr = row[5] || "";

    if (!categoryMap.has(catId)) {
      // Find original category styling to keep nice visual colors
      const originalCat = DEFAULT_SERVICES.find(s => s.id === catId);
      categoryMap.set(catId, {
        id: catId,
        title: catTitle || originalCat?.title || catId.toUpperCase(),
        iconName: originalCat?.iconName || "Bath",
        description: catDesc || originalCat?.description || "",
        details: [],
        colorTheme: originalCat?.colorTheme || {
          badge: "bg-stone-100 text-stone-700 border-stone-200",
          border: "border-stone-100",
          text: "text-stone-700",
          bg: "bg-stone-50",
          accent: "#ff4c00"
        }
      });
    } else {
      // If subsequential rows hold some edit, dynamically update category
      const existing = categoryMap.get(catId)!;
      if (catTitle) existing.title = catTitle;
      if (catDesc) existing.description = catDesc;
    }

    const category = categoryMap.get(catId)!;
    if (detTitle) {
      category.details.push({
        id: detTitle.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        title: detTitle,
        description: detDesc || "",
        bullets: detBulletsStr ? detBulletsStr.split(";").map((b: string) => b.trim()).filter(Boolean) : []
      });
    }
  });

  // If we have parsed category map, convert back to array, otherwise maintain default order
  if (categoryMap.size > 0) {
    // Preserve ordering of original default ids: sanitaer, heizung, lueftung, solar
    const order = ["sanitaer", "heizung", "lueftung", "solar"];
    order.forEach(id => {
      const cat = categoryMap.get(id);
      if (cat) parsedServices.push(cat);
    });
    // Add any newly created category ids if they exist
    categoryMap.forEach((cat, id) => {
      if (!order.includes(id)) parsedServices.push(cat);
    });
  }

  // 3. Tab: Team (Value Range Index 2)
  const teamRows = valueRanges[2]?.values || [];
  teamRows.forEach((row: any[]) => {
    const name = row[0];
    const role = row[1];
    const quote = row[2];
    const desc = row[3];
    const expYear = Number(row[4] || "2000");
    const imageUrl = row[5]; // Read option column at index 5

    if (name) {
      parsedTeam.push({
        name,
        role: role || "",
        quote: quote || "",
        description: desc || "",
        experienceYear: isNaN(expYear) ? 2000 : expYear,
        imageUrl: imageUrl || undefined
      });
    }
  });

  // 4. Tab: Historie (Value Range Index 3)
  const historyRows = valueRanges[3]?.values || [];
  historyRows.forEach((row: any[]) => {
    const year = Number(row[0] || "1981");
    const title = row[1];
    const desc = row[2];

    if (year) {
      parsedHistory.push({
        year: isNaN(year) ? 1981 : year,
        title: title || "",
        description: desc || ""
      });
    }
  });

  // 5. Tab: Karriere (Value Range Index 4)
  const jobRows = valueRanges[4]?.values || [];
  jobRows.forEach((row: any[]) => {
    const id = row[0];
    const title = row[1];
    const type = row[2];
    const intro = row[3];
    const reqStr = row[4] || "";
    const benStr = row[5] || "";

    if (title) {
      parsedJobs.push({
        id: id || title.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        title,
        type: type || "",
        intro: intro || "",
        requirements: reqStr ? reqStr.split(";").map((r: string) => r.trim()).filter(Boolean) : [],
        benefits: benStr ? benStr.split(";").map((b: string) => b.trim()).filter(Boolean) : []
      });
    }
  });

  return {
    allgemeines: Object.keys(parsedAllgemeines).length > 0 ? parsedAllgemeines : DEFAULT_ALLGEMEIN,
    team: parsedTeam.length > 0 ? parsedTeam : DEFAULT_TEAM,
    historie: parsedHistory.length > 0 ? parsedHistory : DEFAULT_HISTORY,
    dienstleistungen: parsedServices.length > 0 ? parsedServices : DEFAULT_SERVICES,
    jobs: parsedJobs.length > 0 ? parsedJobs : DEFAULT_JOBS
  };
}

/**
 * Writes the dynamic CMS content back to the connected Google Sheet
 * Performs a batchClear first to ensure clean row counts, then issues a batchUpdate
 */
export async function writeCMS_Data(token: string, spreadsheetId: string, content: CMSContent): Promise<void> {
  // 1. Clear old values (from row 2 onwards to prevent corrupting header templates)
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`;
  const clearBody = {
    ranges: [
      "'Allgemeines'!A2:C100",
      "'Dienstleistungen'!A2:F200",
      "'Team'!A2:F100",
      "'Historie'!A2:C100",
      "'Karriere'!A2:F100"
    ]
  };

  await fetch(clearUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(clearBody)
  });

  // 2. Prepare Allgemeines Values
  const allgemeinValues = [
    ["Schlüssel", "Wert (Aktueller Inhalt)", "Beschreibung / Wo platziert?"]
  ];
  const allgemeinKeys = [
    ["contact_phone", "Hauptnetz-Telefonnummer der Firma John"],
    ["contact_email", "Offizielle Büro E-Mail-Adresse"],
    ["contact_address", "Firmensitz & Anschrift (Ludwigsfelde)"],
    ["contact_hours", "Büro Öffnungszeiten"],
    ["notdienst_phone", "Ausweichnummer Mobiler Kundenservice & Notfalldienst"],
    ["hero_title", "Haupttitel im Header (H1)"],
    ["hero_subtitle", "Einleitungssatz im Bild-Bereich"],
    ["experience_stat", "Zahl: Jahre an Erfahrung vor Ort"],
    ["success_stat", "Prozentsatz bzw. Qualitätsgarantie-Beschriftung"]
  ];
  allgemeinKeys.forEach(([key, desc]) => {
    allgemeinValues.push([
      key,
      content.allgemeines[key] || "",
      desc
    ]);
  });

  // 3. Prepare Dienstleistungen Values
  const serviceValues = [
    ["Kategorie-ID (sanitaer / heizung / lueftung / solar)", "Kategorie-Überschrift", "Kategorie-Teaser", "Leistungs-Kollektion Titel", "Karte Beschreibung", "Leistungspunkte (mit Semikolon ; trennen)"]
  ];
  content.dienstleistungen.forEach(cat => {
    if (!cat.details || cat.details.length === 0) {
      serviceValues.push([
        cat.id,
        cat.title,
        cat.description,
        "",
        "",
        ""
      ]);
    } else {
      cat.details.forEach((det, idx) => {
        serviceValues.push([
          cat.id,
          idx === 0 ? cat.title : "",
          idx === 0 ? cat.description : "",
          det.title,
          det.description,
          det.bullets.join(";")
        ]);
      });
    }
  });

  // 4. Prepare Team Values
  const teamValues = [
    ["Name", "Rolle / Jobbezeichnung", "Persönliches Zitat", "Biografie (Absatz)", "Dienstjahr (z.B. 1998)", "Bild-URL (Optional)"]
  ];
  content.team.forEach(t => {
    teamValues.push([
      t.name,
      t.role,
      t.quote,
      t.description,
      String(t.experienceYear),
      t.imageUrl || ""
    ]);
  });

  // 5. Prepare Historie Values
  const historyValues = [
    ["Jahr", "Ereignis-Überschrift", "Ausführliche Erläuterung"]
  ];
  content.historie.forEach(h => {
    historyValues.push([
      String(h.year),
      h.title,
      h.description
    ]);
  });

  // 6. Prepare Karriere Values
  const jobValues = [
    ["ID", "Stellenbezeichnung", "Anstellung & Typ", "Einleitungssatz", "Anforderungen (mit Semikolon ; trennen)", "Unternehmensvorteile (mit Semikolon ; trennen)"]
  ];
  content.jobs.forEach(j => {
    jobValues.push([
      j.id,
      j.title,
      j.type,
      j.intro,
      j.requirements.join(";"),
      j.benefits.join(";")
    ]);
  });

  // 7. Write everything back using userEntered format option
  const batchBody = {
    valueInputOption: "USER_ENTERED",
    data: [
      { range: `'Allgemeines'!A1:C${allgemeinValues.length}`, values: allgemeinValues },
      { range: `'Dienstleistungen'!A1:F${serviceValues.length}`, values: serviceValues },
      { range: `'Team'!A1:F${teamValues.length}`, values: teamValues },
      { range: `'Historie'!A1:C${historyValues.length}`, values: historyValues },
      { range: `'Karriere'!A1:F${jobValues.length}`, values: jobValues }
    ]
  };

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const response = await fetch(updateUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(batchBody)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fehler beim Schreiben der CMS-Daten in Google Sheets: ${text}`);
  }
}
