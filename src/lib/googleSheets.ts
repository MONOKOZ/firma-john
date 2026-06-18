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
import type { CMSContent } from "../types";
import { DEFAULT_CONTENT } from "../data";
import { TAB_ORDER } from "../content.schema";
import { decodeContent } from "./sheets/mapper";
import { buildSheetPayload } from "./sheets/payload";

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
  if (!file.type.startsWith("image/")) {
    throw new Error("Bitte wählen Sie nur Bilddateien (JPEG/PNG/WebP) aus.");
  }
  // Max size check: 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Die Bilddatei ist zu groß (maximal 5 MB erlaubt).");
  }

  // Upload über den eigenen Worker-Endpunkt → Cloudflare R2 (same-origin, kein CORS).
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => ({} as any));
    throw new Error(data?.error || `Upload fehlgeschlagen (${res.status}).`);
  }
  const data = await res.json();
  return data.url as string;
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

// ── CMS: Content lesen/schreiben via Google Sheets ───────────────────────────
// CMSContent + Default-Seed liegen zentral (types.ts / data.ts). Re-Export für
// bestehende Importe — CMSContext.tsx importiert beides aus dieser Datei.
export type { CMSContent } from "../types";
export { DEFAULT_ALLGEMEIN } from "../data";

/** Gemeinsamer batchUpdate-Helfer (USER_ENTERED, mit response.ok-Prüfung). */
async function sheetsBatchUpdate(
  token: string,
  spreadsheetId: string,
  data: { range: string; values: any[][] }[]
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
  });
  if (!response.ok) {
    throw new Error(`Fehler beim Schreiben der CMS-Daten in Google Sheets: ${await response.text()}`);
  }
}

/**
 * Erstellt die vollständige Google-Sheets-CMS-Vorlage (5 Tabs) und seedet sie
 * mit den Default-Inhalten.
 */
export async function createCMS_Sheet(token: string): Promise<string> {
  const fileBody = {
    properties: { title: "JOHN Haustechnik - Homepage CMS (Live)" },
    sheets: TAB_ORDER.map((tab) => ({
      properties: { title: tab, gridProperties: { frozenRowCount: 1, columnCount: 10 } },
    })),
  };

  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(fileBody),
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Erstellen des CMS Sheets: ${await response.text()}`);
  }

  const data = await response.json();
  await populateCMSDefaultData(token, data.spreadsheetId);
  return data.spreadsheetId;
}

/** Seedet ein frisches Sheet mit den Default-Inhalten — eine Quelle: buildSheetPayload. */
async function populateCMSDefaultData(token: string, spreadsheetId: string): Promise<void> {
  await sheetsBatchUpdate(token, spreadsheetId, buildSheetPayload(DEFAULT_CONTENT));
}

/**
 * Liest alle Tabs (inkl. Header-Zeile ab A1) und dekodiert header-NAMENS-basiert
 * → CMSContent. DEFAULT_CONTENT liefert Fallback bei leeren Sektionen + Service-Styling.
 */
export async function fetchCMS_Data(token: string, spreadsheetId: string): Promise<CMSContent> {
  const ranges = TAB_ORDER.map((tab) => `${tab}!A1:F200`).join("&ranges=");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges}`;

  const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
  if (!response.ok) {
    throw new Error("Fehler beim Abrufen der CMS-Daten aus Google Sheets.");
  }

  const result = await response.json();
  return decodeContent(result.valueRanges || [], DEFAULT_CONTENT);
}

/**
 * Schreibt CMSContent zurück ins Sheet.
 * M1: funktional wie bisher (batchClear → batchUpdate), Payload jetzt aus
 * buildSheetPayload (eine Quelle). Atomarer Single-batchUpdate folgt in M4.
 */
export async function writeCMS_Data(token: string, spreadsheetId: string, content: CMSContent): Promise<void> {
  // 1. Alte Werte ab Zeile 2 leeren (Header-Templates bleiben unangetastet)
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`;
  const clearBody = {
    ranges: [
      "'Allgemeines'!A2:C100",
      "'Dienstleistungen'!A2:F200",
      "'Team'!A2:F100",
      "'Historie'!A2:C100",
      "'Karriere'!A2:F100",
    ],
  };
  await fetch(clearUrl, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(clearBody),
  });

  // 2. Vollständige Payload (Header + Daten) schreiben
  await sheetsBatchUpdate(token, spreadsheetId, buildSheetPayload(content));
}
