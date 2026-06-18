/**
 * POST /api/auth/session — tauscht ein Google-ID-Token gegen ein 30-Tage-Session-Cookie.
 *
 * Body: { idToken: string } (vom Client nach Google-Login).
 * Ablauf: ID-Token verifizieren (Google JWKS) → Allowlist-Check → Session-Cookie setzen.
 */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import firebaseConfig from "../../../../firebase-applet-config.json";
import { verifyFirebaseIdToken, isEmailAllowed } from "../../../lib/auth/identity";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "../../../lib/auth/session";

export const prerender = false;

function projectId(): string {
  const cfg: any = firebaseConfig;
  return cfg?.projectId || cfg?.default?.projectId || "";
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const e = env as any;
  const sessionSecret: string = e.SESSION_SECRET;
  const allowed: string = e.ALLOWED_EMAILS || "";

  if (!sessionSecret) {
    return Response.json({ error: "Server-Konfiguration fehlt (SESSION_SECRET)." }, { status: 500 });
  }

  let idToken = "";
  try {
    const body = await request.json();
    idToken = body?.idToken || "";
  } catch { /* ignore */ }
  if (!idToken) {
    return Response.json({ error: "idToken fehlt." }, { status: 400 });
  }

  const identity = await verifyFirebaseIdToken(idToken, projectId());
  if (!identity || !identity.emailVerified) {
    return Response.json({ error: "Identität ungültig oder E-Mail nicht verifiziert." }, { status: 401 });
  }
  if (!isEmailAllowed(identity.email, allowed)) {
    return Response.json({ error: "Diese E-Mail hat keinen Zugriff auf das Backend." }, { status: 403 });
  }

  const token = await createSessionToken(identity.email, sessionSecret);
  cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return Response.json({ ok: true, email: identity.email });
};
