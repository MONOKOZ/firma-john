/**
 * POST /api/cms/save — speichert CMSContent ins Sheet (session-gated, SA, validiert, atomar).
 * Body: { content: CMSContent }. Bei Limit-Verstoß → 422 mit Feld-Fehlern.
 */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { SESSION_COOKIE, verifySessionToken } from "../../../lib/auth/session";
import { writeContent } from "../../../lib/sheets/write";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const e = env as any;
  const session = await verifySessionToken(cookies.get(SESSION_COOKIE)?.value || "", e.SESSION_SECRET);
  if (!session) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });

  let content;
  try {
    content = (await request.json())?.content;
  } catch { /* ignore */ }
  if (!content) return Response.json({ error: "content fehlt." }, { status: 400 });

  const result = await writeContent(content, env);
  if (!result.ok) {
    return Response.json({ error: result.error, errors: result.errors }, { status: result.status });
  }
  return Response.json({ ok: true });
};
