/**
 * POST /api/upload — Bild-Upload (session-gated) → Cloudflare R2.
 * Same-Origin → kein CORS. Magic-Byte-Check + SVG-Ausschluss + 5 MB-Limit (Security §7).
 * Antwort: { url: "/api/img/<key>" } — die URL kommt ins Sheet, die Seite rendert sie.
 */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { SESSION_COOKIE, verifySessionToken } from "../../lib/auth/session";

export const prerender = false;

const MAX_SIZE = 5 * 1024 * 1024;

/** Erkennt Raster-Bilder an den Magic-Bytes. Null = nicht erlaubt (auch SVG). */
function detectImage(b: Uint8Array): { ext: string; type: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { ext: "gif", type: "image/gif" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { ext: "webp", type: "image/webp" };
  return null;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const e = env as any;
  const session = await verifySessionToken(cookies.get(SESSION_COOKIE)?.value || "", e.SESSION_SECRET);
  if (!session) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!e.UPLOADS) return Response.json({ error: "Storage (R2) nicht konfiguriert." }, { status: 500 });

  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch { /* ignore */ }
  if (!file) return Response.json({ error: "Keine Datei empfangen." }, { status: 400 });
  if (file.size > MAX_SIZE) return Response.json({ error: "Datei zu groß (max. 5 MB)." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImage(bytes);
  if (!kind) return Response.json({ error: "Nur JPG, PNG, GIF oder WebP erlaubt (kein SVG)." }, { status: 415 });

  const safe = (file.name || "bild").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
  const key = `uploads/${Date.now()}_${safe}.${kind.ext}`;
  await e.UPLOADS.put(key, bytes, { httpMetadata: { contentType: kind.type } });

  return Response.json({ url: `/api/img/${key}` });
};
