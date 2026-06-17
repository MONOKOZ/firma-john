/**
 * content.schema.ts — Single Source of Truth für die Inhalts-Struktur.
 *
 * PRO KUNDE ist DIES die zentrale anzufassende Kerndatei (siehe KONZEPT §5).
 * Die Master-Engine (src/lib/sheets/{mapper,payload,validate}) leitet hieraus ab:
 *   - das header-basierte Sheet-Mapping (KEIN row[n] mehr),
 *   - die Schreib-Payload (eine Quelle statt populate/write-Duplikat),
 *   - Limits/Validierung (zentral statt ~25× im JSX verstreut),
 *   - die Default-/Seed-Werte (DEFAULT_ALLGEMEIN war 3× dupliziert).
 *
 * WICHTIG: `header`-Strings sind die EXAKTEN Spaltenüberschriften im Google Sheet.
 * Das Mapping erfolgt namensbasiert über diese Header → robust gegen Spaltenverschiebung.
 * Beim Ändern eines Headers muss die Header-Zeile im Sheet mitgezogen werden.
 */

export type FieldType = "text" | "longtext" | "number" | "url" | "list";

export interface FieldSpec {
  /** Exakte Sheet-Spaltenüberschrift (Basis des header-basierten Mappings). */
  header: string;
  /** Menschliches Label im Admin-Formular. */
  label: string;
  type: FieldType;
  /** Harte Zeichengrenze → maxLength + Save-Gate + Server-Validierung. */
  limit?: number;
  /** Empfohlener Bereich (nur UX-Hinweis / Counter-Färbung). */
  idealMin?: number;
  idealMax?: number;
  /** Trennzeichen für `type: "list"`-Felder (bullets/requirements/benefits). */
  listSeparator?: string;
  /** Optionales Feld (z. B. Bild-URL). */
  optional?: boolean;
}

/** Allgemeines = Key-Value-Tab: jede ZEILE ist ein Feld (Schlüssel/Wert/Beschreibung). */
export interface KeyValueEntity {
  shape: "keyValue";
  sheetTab: string;
  /** Feste Spaltenüberschriften des Key-Value-Tabs (Schlüssel, Wert, Beschreibung). */
  columns: readonly [string, string, string];
  /** Beschreibung pro Schlüssel (3. Spalte im Sheet — Doku für den Kunden). */
  fields: Record<string, FieldSpec & { description: string }>;
}

/** Liste = ein Datensatz pro Zeile (Team, Historie, Karriere). */
export interface ListEntity {
  shape: "list";
  sheetTab: string;
  /** Spalten in Sheet-Reihenfolge. `key` = Property im TS-Objekt. */
  columns: ReadonlyArray<FieldSpec & { key: string }>;
}

/** Service-Baum = Kategorie→Details, flach in Zeilen kodiert (Dienstleistungen). */
export interface ServiceTreeEntity {
  shape: "serviceTree";
  sheetTab: string;
  columns: {
    categoryId: FieldSpec;
    categoryTitle: FieldSpec;
    categoryDescription: FieldSpec;
    detailTitle: FieldSpec;
    detailDescription: FieldSpec;
    detailBullets: FieldSpec;
  };
}

export type Entity = KeyValueEntity | ListEntity | ServiceTreeEntity;

/**
 * Tab-Reihenfolge wie im bestehenden Sheet. Engine iteriert hierüber.
 * (Ersetzt das lose `TABS`-Array in googleSheets.ts.)
 */
export const schema = {
  allgemeines: {
    shape: "keyValue",
    sheetTab: "Allgemeines",
    columns: ["Schlüssel", "Wert (Aktueller Inhalt)", "Beschreibung / Wo platziert?"],
    fields: {
      contact_phone: {
        header: "contact_phone", label: "Telefon (Hauptnetz)", type: "text", limit: 25,
        description: "Hauptnetz-Telefonnummer der Firma John",
      },
      contact_email: {
        header: "contact_email", label: "E-Mail (Büro)", type: "text", limit: 50,
        description: "Offizielle Büro E-Mail-Adresse",
      },
      contact_address: {
        header: "contact_address", label: "Anschrift", type: "text", limit: 100,
        description: "Firmensitz & Anschrift (Ludwigsfelde)",
      },
      contact_hours: {
        header: "contact_hours", label: "Öffnungszeiten", type: "text", limit: 120,
        description: "Büro Öffnungszeiten",
      },
      notdienst_phone: {
        header: "notdienst_phone", label: "Notdienst-Telefon", type: "text", limit: 25,
        description: "Ausweichnummer Mobiler Kundenservice & Notfalldienst",
      },
      hero_title: {
        header: "hero_title", label: "Hero-Titel (H1)", type: "text", limit: 110, idealMin: 35, idealMax: 75,
        description: "Haupttitel im Header (H1)",
      },
      hero_subtitle: {
        header: "hero_subtitle", label: "Hero-Subtitel", type: "longtext", limit: 320, idealMin: 120, idealMax: 260,
        description: "Einleitungssatz im Bild-Bereich",
      },
      experience_stat: {
        header: "experience_stat", label: "Statistik: Erfahrung", type: "text", limit: 20,
        description: "Zahl: Jahre an Erfahrung vor Ort",
      },
      success_stat: {
        header: "success_stat", label: "Statistik: Erfolg", type: "text", limit: 20,
        description: "Prozentsatz bzw. Qualitätsgarantie-Beschriftung",
      },
    },
  } satisfies KeyValueEntity,

  dienstleistungen: {
    shape: "serviceTree",
    sheetTab: "Dienstleistungen",
    columns: {
      categoryId: {
        header: "Kategorie-ID (sanitaer / heizung / lueftung / solar)", label: "Kategorie-ID", type: "text",
      },
      categoryTitle: {
        header: "Kategorie-Überschrift", label: "Kategorie-Überschrift", type: "text", limit: 40,
      },
      categoryDescription: {
        header: "Kategorie-Teaser", label: "Kategorie-Teaser", type: "longtext", limit: 250, idealMin: 60, idealMax: 180,
      },
      detailTitle: {
        header: "Leistungs-Kollektion Titel", label: "Leistungs-Titel", type: "text", limit: 40,
      },
      detailDescription: {
        header: "Karte Beschreibung", label: "Karte-Beschreibung", type: "longtext", limit: 160, idealMin: 40, idealMax: 120,
      },
      detailBullets: {
        header: "Leistungspunkte (mit Semikolon ; trennen)", label: "Leistungspunkte", type: "list", listSeparator: ";",
      },
    },
  } satisfies ServiceTreeEntity,

  team: {
    shape: "list",
    sheetTab: "Team",
    columns: [
      { key: "name", header: "Name", label: "Name", type: "text", limit: 60 },
      { key: "role", header: "Rolle / Jobbezeichnung", label: "Rolle", type: "text", limit: 80 },
      { key: "quote", header: "Persönliches Zitat", label: "Zitat", type: "longtext", limit: 180, idealMin: 50, idealMax: 130 },
      { key: "description", header: "Biografie (Absatz)", label: "Biografie", type: "longtext", limit: 360, idealMin: 120, idealMax: 260 },
      { key: "experienceYear", header: "Dienstjahr (z.B. 1998)", label: "Dienstjahr", type: "number" },
      { key: "imageUrl", header: "Bild-URL (Optional)", label: "Bild-URL", type: "url", optional: true },
    ],
  } satisfies ListEntity,

  historie: {
    shape: "list",
    sheetTab: "Historie",
    columns: [
      { key: "year", header: "Jahr", label: "Jahr", type: "number" },
      { key: "title", header: "Ereignis-Überschrift", label: "Überschrift", type: "text", limit: 60 },
      { key: "description", header: "Ausführliche Erläuterung", label: "Erläuterung", type: "longtext", limit: 250, idealMin: 40, idealMax: 180 },
    ],
  } satisfies ListEntity,

  jobs: {
    shape: "list",
    sheetTab: "Karriere",
    columns: [
      { key: "id", header: "ID", label: "ID", type: "text" },
      { key: "title", header: "Stellenbezeichnung", label: "Stellenbezeichnung", type: "text", limit: 60 },
      { key: "type", header: "Anstellung & Typ", label: "Anstellung & Typ", type: "text", limit: 40 },
      { key: "intro", header: "Einleitungssatz", label: "Einleitung", type: "longtext", limit: 250 },
      { key: "requirements", header: "Anforderungen (mit Semikolon ; trennen)", label: "Anforderungen", type: "list", listSeparator: ";" },
      { key: "benefits", header: "Unternehmensvorteile (mit Semikolon ; trennen)", label: "Vorteile", type: "list", listSeparator: ";" },
    ],
  } satisfies ListEntity,
} as const;

/** Tab-Reihenfolge (ersetzt das harte TABS-Array). */
export const TAB_ORDER = [
  schema.allgemeines.sheetTab,
  schema.dienstleistungen.sheetTab,
  schema.team.sheetTab,
  schema.historie.sheetTab,
  schema.jobs.sheetTab,
] as const;

export type Schema = typeof schema;
