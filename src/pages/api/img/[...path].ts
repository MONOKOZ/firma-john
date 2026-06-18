/**
 * GET /api/img/<key> — liefert ein Bild aus Cloudflare R2 (öffentlich, same-origin).
 * Keine Auth (Bilder müssen für jeden Seitenbesucher ladbar sein).
 */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const e = env as any;
  const key = params.path;
  if (!key || !e.UPLOADS) return new Response("Not found", { status: 404 });

  const obj = await e.UPLOADS.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("Content-Type", obj.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
};
