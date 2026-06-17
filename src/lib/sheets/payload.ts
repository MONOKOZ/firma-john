/**
 * payload.ts — kodiert CMSContent → Sheet-Schreib-Payload (batchUpdate-Format).
 *
 * Master-Engine. EINE Quelle für das Sheet-Layout: ersetzt die ~90 % Duplikation
 * zwischen `populateCMSDefaultData` und `writeCMS_Data` (beide bauten dieselben
 * Header/Zeilen-Strukturen). Header-Zeile + Spaltenreihenfolge kommen aus dem Schema.
 */
import type { CMSContent, ServiceCategory } from "../../types";
import { schema, type ListEntity } from "../../content.schema";

type Matrix = any[][];

/** Spaltenzahl → A1-Spaltenbuchstabe (genügt für ≤ 26 Spalten). */
function colLetter(n: number): string {
  return String.fromCharCode(64 + Math.max(1, n));
}

function encodeAllgemeines(allg: Record<string, string>): Matrix {
  const e = schema.allgemeines;
  const header = [...e.columns];
  const rows = Object.entries(e.fields).map(([key, spec]) => [key, allg[key] ?? "", spec.description]);
  return [header, ...rows];
}

function encodeServices(cats: ServiceCategory[]): Matrix {
  const c = schema.dienstleistungen.columns;
  const sep = c.detailBullets.listSeparator || ";";
  const header = [
    c.categoryId.header, c.categoryTitle.header, c.categoryDescription.header,
    c.detailTitle.header, c.detailDescription.header, c.detailBullets.header,
  ];
  const rows: Matrix = [];
  cats.forEach((cat) => {
    if (!cat.details || cat.details.length === 0) {
      rows.push([cat.id, cat.title, cat.description, "", "", ""]);
    } else {
      cat.details.forEach((det, idx) => rows.push([
        cat.id,
        idx === 0 ? cat.title : "",
        idx === 0 ? cat.description : "",
        det.title,
        det.description,
        det.bullets.join(sep),
      ]));
    }
  });
  return [header, ...rows];
}

function encodeList(entity: ListEntity, items: any[]): Matrix {
  const header = entity.columns.map((c) => c.header);
  const rows = items.map((item) => entity.columns.map((c) => {
    const v = item[c.key];
    if (c.type === "list") return Array.isArray(v) ? v.join(c.listSeparator || ";") : (v ?? "");
    if (c.type === "number") return v === undefined || v === null ? "" : String(v);
    return v ?? "";
  }));
  return [header, ...rows];
}

export interface SheetBlock { range: string; values: Matrix; }

/**
 * Baut die vollständige batchUpdate-Payload (Header + Daten je Tab).
 * Wird sowohl beim Seed (Default-Daten) als auch beim normalen Speichern genutzt.
 */
export function buildSheetPayload(content: CMSContent): SheetBlock[] {
  const blocks: { tab: string; values: Matrix }[] = [
    { tab: schema.allgemeines.sheetTab, values: encodeAllgemeines(content.allgemeines) },
    { tab: schema.dienstleistungen.sheetTab, values: encodeServices(content.dienstleistungen) },
    { tab: schema.team.sheetTab, values: encodeList(schema.team, content.team) },
    { tab: schema.historie.sheetTab, values: encodeList(schema.historie, content.historie) },
    { tab: schema.jobs.sheetTab, values: encodeList(schema.jobs, content.jobs) },
  ];
  return blocks.map((b) => ({
    range: `'${b.tab}'!A1:${colLetter(b.values[0].length)}${b.values.length}`,
    values: b.values,
  }));
}
