/**
 * read.ts — BUILD-ZEIT-Lesen des Google Sheets via Service Account.
 *
 * Läuft ausschließlich serverseitig zur Build-Zeit (Node-Kontext, kein Client-Bundle).
 * Holt per Service-Account-JWT ein read-only Access-Token, liest alle Tabs und
 * dekodiert sie header-basiert über die M1-Engine (decodeContent).
 *
 * Robust: ohne Creds/SHEET_ID oder bei Fehler → Fallback auf DEFAULT_CONTENT (data.ts),
 * damit CI/Builds ohne Netz/Secrets nicht brechen.
 */
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { JWT } from "google-auth-library";
import { decodeContent } from "./mapper";
import { TAB_ORDER } from "../../content.schema";
import { DEFAULT_CONTENT } from "../../data";
import type { CMSContent } from "../../types";

interface SACreds { client_email: string; private_key: string; }

/** Lädt SA-Creds: Env-base64 (CI/Cloudflare) → Einzel-Env → lokale JSON-Datei. */
function loadCredentials(): SACreds | null {
  const b64 = process.env.GOOGLE_SA_KEY_BASE64;
  if (b64) {
    try {
      const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
      if (json.client_email && json.private_key) return json;
    } catch { /* weiter zur nächsten Variante */ }
  }

  if (process.env.GOOGLE_SA_EMAIL && process.env.GOOGLE_SA_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_SA_EMAIL,
      private_key: process.env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  const path = process.env.GOOGLE_SA_KEY_FILE || ".secrets/service-account.json";
  if (existsSync(path)) {
    try {
      const json = JSON.parse(readFileSync(path, "utf8"));
      if (json.client_email && json.private_key) return json;
    } catch { /* fällt unten auf null */ }
  }
  return null;
}

async function fetchSheet(creds: SACreds, sheetId: string): Promise<CMSContent | null> {
  const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const { token } = await client.getAccessToken();
  if (!token) return null;

  const ranges = TAB_ORDER
    .map((tab) => `ranges=${encodeURIComponent(`${tab}!A1:F200`)}`)
    .join("&");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?${ranges}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.warn(`[sheets] batchGet ${res.status}: ${await res.text()}`);
    return null;
  }
  const json = await res.json();
  return decodeContent(json.valueRanges || [], DEFAULT_CONTENT);
}

/**
 * Liefert den Seiteninhalt zur Build-Zeit. Echtes Sheet, sonst DEFAULT_CONTENT.
 */
export async function getContent(): Promise<CMSContent> {
  const sheetId = process.env.SHEET_ID;
  const creds = loadCredentials();

  if (!sheetId || !creds) {
    console.warn("[sheets] Keine SHEET_ID/SA-Creds → Fallback auf DEFAULT_CONTENT (data.ts).");
    return DEFAULT_CONTENT;
  }

  try {
    const content = await fetchSheet(creds, sheetId);
    if (content) {
      console.log("[sheets] Build-Read OK — echte Sheet-Inhalte geladen.");
      return content;
    }
    console.warn("[sheets] Build-Read leer → Fallback DEFAULT_CONTENT.");
  } catch (e: any) {
    console.warn("[sheets] Build-Read fehlgeschlagen → Fallback DEFAULT_CONTENT:", e?.message);
  }
  return DEFAULT_CONTENT;
}
