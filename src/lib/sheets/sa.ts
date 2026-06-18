/**
 * sa.ts — Service-Account-Auth, deploy-neutral (Node + Workers, via jose/Web Crypto).
 *
 * Gemeinsame Basis für read.ts (readonly) und write.ts (read-write). Credentials
 * kommen aus ENV (GOOGLE_SA_KEY_BASE64 | Einzel-Env); JWT-Signatur via jose.
 */
import { SignJWT, importPKCS8 } from "jose";

export type EnvLike = Record<string, any>;
export interface SACreds { client_email: string; private_key: string; }

export const SCOPE_READONLY = "https://www.googleapis.com/auth/spreadsheets.readonly";
export const SCOPE_READWRITE = "https://www.googleapis.com/auth/spreadsheets";

/** base64 → utf8, funktioniert in Workers (atob) und Node. */
export function fromBase64(b64: string): string {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

/** Env-Kaskade: übergebene (Cloudflare-)Env gewinnt; process.env als Node-Fallback. */
export function resolveEnv(runtimeEnv?: EnvLike): EnvLike {
  const fromProc = (typeof process !== "undefined" && process.env) || {};
  return { ...fromProc, ...(runtimeEnv || {}) };
}

export function loadCredentials(env: EnvLike): SACreds | null {
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
    return { client_email: env.GOOGLE_SA_EMAIL, private_key: String(env.GOOGLE_SA_PRIVATE_KEY).replace(/\\n/g, "\n") };
  }
  return null;
}

/** SA-JWT (RS256, Web Crypto) → OAuth-Access-Token mit gegebenem Scope. */
export async function getAccessToken(creds: SACreds, scope: string): Promise<string | null> {
  const key = await importPKCS8(creds.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope })
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
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) {
    console.warn(`[sheets] Token-Exchange ${res.status}: ${await res.text()}`);
    return null;
  }
  const json = await res.json();
  return json.access_token || null;
}
