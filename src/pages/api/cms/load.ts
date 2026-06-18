/**
 * GET /api/cms/load — liefert den aktuellen Sheet-Content (session-gated, via SA).
 */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { SESSION_COOKIE, verifySessionToken } from "../../../lib/auth/session";
import { getContent } from "../../../lib/sheets/read";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const e = env as any;
  const session = await verifySessionToken(cookies.get(SESSION_COOKIE)?.value || "", e.SESSION_SECRET);
  if (!session) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });

  const content = await getContent(env);
  return Response.json({ content });
};
