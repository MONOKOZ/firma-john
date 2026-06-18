/**
 * session.ts — eigenes 30-Tage-Session-Cookie (signiert via jose HS256).
 *
 * Nach erfolgreicher Google-Identitätsprüfung (identity.ts) stellt der Server
 * dieses Cookie aus. Es enthält NUR die E-Mail (Identität) — kein Google-Token.
 * Läuft in Node und Workers (jose = Web Crypto).
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "fj_session";
const MAX_AGE_DAYS = 30;
export const SESSION_MAX_AGE = MAX_AGE_DAYS * 24 * 60 * 60; // Sekunden

export interface SessionData { email: string; }

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(email: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_MAX_AGE)
    .sign(key(secret));
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionData | null> {
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret));
    return typeof payload.email === "string" ? { email: payload.email } : null;
  } catch {
    return null;
  }
}

/** Standard-Cookie-Optionen (httpOnly/Secure/SameSite=Strict, 30 Tage). */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
