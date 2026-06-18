/**
 * identity.ts — verifiziert ein Firebase-Google-ID-Token serverseitig.
 *
 * Google-Login dient NUR der Identitätsfeststellung (kein Sheets-Token im Browser).
 * Verifikation via jose + Googles öffentliche JWKS (RS256) — KEIN Firebase Admin SDK
 * (das liefe nicht in der Workers-Runtime). Danach Allowlist-Check.
 */
import { jwtVerify, createRemoteJWKSet } from "jose";

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export interface VerifiedIdentity {
  email: string;
  emailVerified: boolean;
  uid: string;
}

/** Prüft Signatur + iss/aud/exp des Firebase-ID-Tokens. Null = ungültig. */
export async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string,
): Promise<VerifiedIdentity | null> {
  if (!idToken || !projectId) return null;
  try {
    const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    if (!email) return null;
    return {
      email,
      emailVerified: payload.email_verified === true,
      uid: typeof payload.sub === "string" ? payload.sub : "",
    };
  } catch {
    return null;
  }
}

/** Ist die E-Mail in der (kommagetrennten) Allowlist? */
export function isEmailAllowed(email: string, allowedList: string): boolean {
  const list = allowedList.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}
