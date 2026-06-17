/**
 * read.ts — Live-Lesen des Google Sheets, deploy-neutral (Node-Build UND Workers-SSR).
 *
 * Seit der SSR-Umstellung läuft getContent() bei jedem Seitenaufruf am Edge
 * (Cloudflare Workers-Runtime) statt einmal beim Build. Darum:
 *  - JWT-Signatur via `jose` (Web Crypto) statt google-auth-library (Node-only),
 *  - Credentials aus ENV (kein node:fs),
 *  - Env-Quelle wird durchgereicht: Cloudflare-Runtime (Astro.locals.runtime.env)
 *    > import.meta.env (lokaler Build/Dev) > process.env (Node).
 *
 * Robust: ohne SHEET_ID/Creds oder bei Fehler → Fallback auf DEFAULT_CONTENT (data.ts).
 */
import { SignJWT, importPKCS8 } from "jose";
import { decodeContent } from "./mapper";
import { TAB_ORDER } from "../../content.schema";
import { DEFAULT_CONTENT } from "../../data";
import type { CMSContent } from "../../types";

type EnvLike = Record<string, string | undefined>;
interface SACreds { client_email: string; private_key: string; }

/** base64 → utf8, funktioniert in Workers (atob) und Node. */
function fromBase64(b64: string): string {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

/** Env-Kaskade: übergebene (Cloudflare-)Env gewinnt; process.env als Node-Fallback.
 *  Bewusst KEIN import.meta.env — das würde Secrets zur Build-Zeit ins Bundle inlinen. */
function resolveEnv(runtimeEnv?: EnvLike): EnvLike {
  const fromProc = (typeof process !== "undefined" && process.env) || {};
  return { ...fromProc, ...(runtimeEnv || {}) };
}

function loadCredentials(env: EnvLike): SACreds | null {
  const b64 = env.GOOGLE_SA_KEY_BASE64;
  if (b64) {
    try {
      const json = JSON.parse(fromBase64(b64));
      if (json.client_email && json.private_key) {
        return { client_email: json.client_email, private_key: json.private_key };
      }
    } catch { /* nächste Variante */ }
  }
  if (env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_PRIVATE_KEY) {
    return { client_email: env.GOOGLE_SA_EMAIL, private_key: env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, "\n") };
  }
  return null;
}

/** Service-Account-JWT (RS256, Web Crypto) → OAuth-Access-Token (read-only). */
async function getAccessToken(creds: SACreds): Promise<string | null> {
  const key = await importPKCS8(creds.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/spreadsheets.readonly" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(creds.client_email)
    .setSubject(creds.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    console.warn(`[sheets] Token-Exchange ${res.status}: ${await res.text()}`);
    return null;
  }
  const json = await res.json();
  return json.access_token || null;
}

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

/**
 * Live-Content. `runtimeEnv` = Cloudflare-Env (Astro.locals.runtime.env) im SSR;
 * lokal undefined → Fallback auf import.meta.env/process.env.
 */
export async function getContent(runtimeEnv?: EnvLike): Promise<CMSContent> {
  const env = resolveEnv(runtimeEnv);
  const sheetId = env.SHEET_ID;
  const creds = loadCredentials(env);

  if (!sheetId || !creds) {
    console.warn("[sheets] Keine SHEET_ID/SA-Creds → Fallback DEFAULT_CONTENT (data.ts).");
    return DEFAULT_CONTENT;
  }

  try {
    const token = await getAccessToken(creds);
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
