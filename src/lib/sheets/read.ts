/**
 * read.ts — Live-Lesen des Google Sheets (Node-Build & Workers-SSR), via SA (readonly).
 * JWT/Creds/Env-Handling liegt in sa.ts; hier nur Fetch + Dekodieren über die M1-Engine.
 * Robust: ohne SHEET_ID/Creds oder bei Fehler → Fallback DEFAULT_CONTENT (data.ts).
 */
import { decodeContent } from "./mapper";
import { TAB_ORDER } from "../../content.schema";
import { DEFAULT_CONTENT } from "../../data";
import type { CMSContent } from "../../types";
import { resolveEnv, loadCredentials, getAccessToken, SCOPE_READONLY, type EnvLike } from "./sa";

async function fetchSheet(token: string, sheetId: string): Promise<CMSContent | null> {
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

/** Live-Content. `runtimeEnv` = Cloudflare-Env im SSR; lokal Fallback auf process.env. */
export async function getContent(runtimeEnv?: EnvLike): Promise<CMSContent> {
  const env = resolveEnv(runtimeEnv);
  const sheetId = env.SHEET_ID;
  const creds = loadCredentials(env);

  if (!sheetId || !creds) {
    console.warn("[sheets] Keine SHEET_ID/SA-Creds → Fallback DEFAULT_CONTENT (data.ts).");
    return DEFAULT_CONTENT;
  }

  try {
    const token = await getAccessToken(creds, SCOPE_READONLY);
    if (token) {
      const content = await fetchSheet(token, sheetId);
      if (content) {
        console.log("[sheets] Live-Read OK — echte Sheet-Inhalte geladen.");
        return content;
      }
    }
    console.warn("[sheets] Live-Read leer → Fallback DEFAULT_CONTENT.");
  } catch (e: any) {
    console.warn("[sheets] Live-Read fehlgeschlagen → Fallback DEFAULT_CONTENT:", e?.message);
  }
  return DEFAULT_CONTENT;
}
