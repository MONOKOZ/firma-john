/**
 * POST /api/auth/logout — löscht das Session-Cookie.
 */
import type { APIRoute } from "astro";
import { SESSION_COOKIE } from "../../../lib/auth/session";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(SESSION_COOKIE, { path: "/" });
  return Response.json({ ok: true });
};
