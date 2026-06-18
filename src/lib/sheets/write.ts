/**
 * write.ts — schreibt CMSContent serverseitig ins Sheet (SA, read-write).
 *
 * - Server-seitige Schema-Validierung (Layout-Schutz; Client-Limits sind umgehbar).
 * - EIN atomarer padded batchUpdate (überschreibt Restzeilen, kein separates batchClear).
 * - Dank SSR ist die Änderung sofort live (kein Rebuild/Deploy-Hook).
 */
import { buildSheetPayload } from "./payload";
import { validate, type ValidationError } from "./validate";
import type { CMSContent } from "../../types";
import { resolveEnv, loadCredentials, getAccessToken, SCOPE_READWRITE, type EnvLike } from "./sa";

const PAD_ROWS = 200; // Restzeilen mit Leer überschreiben → atomarer Single-Write

export interface WriteResult {
  ok: boolean;
  status: number;
  error?: string;
  errors?: ValidationError[];
}

export async function writeContent(content: CMSContent, runtimeEnv?: EnvLike): Promise<WriteResult> {
  const errors = validate(content);
  if (errors.length > 0) {
    return { ok: false, status: 422, error: "Validierung fehlgeschlagen.", errors };
  }

  const env = resolveEnv(runtimeEnv);
  const sheetId = env.SHEET_ID;
  const creds = loadCredentials(env);
  if (!sheetId || !creds) return { ok: false, status: 500, error: "SHEET_ID/SA-Creds fehlen." };

  const token = await getAccessToken(creds, SCOPE_READWRITE);
  if (!token) return { ok: false, status: 502, error: "Google-Token-Exchange fehlgeschlagen." };

  const data = buildSheetPayload(content, PAD_ROWS);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
  });
  if (!res.ok) {
    return { ok: false, status: 502, error: `Sheet-Write ${res.status}: ${await res.text()}` };
  }
  return { ok: true, status: 200 };
}
