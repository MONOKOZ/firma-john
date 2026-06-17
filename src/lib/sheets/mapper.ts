/**
 * mapper.ts — header-NAMENS-basiertes Dekodieren von Sheet-Zeilen → CMSContent.
 *
 * Master-Engine. Ersetzt den positionsbasierten `row[0..5]`-Zugriff aus
 * googleSheets.ts. Liest die Header-Zeile jedes Tabs und mappt Spalten über
 * ihren NAMEN (aus content.schema.ts) → robust gegen Spaltenverschiebung.
 * Findet ein Header keinen Treffer, fällt er auf die Schema-Position zurück
 * (Abwärtskompatibilität zu Sheets ohne saubere Header-Zeile).
 */
import type {
  CMSContent, ServiceCategory, TeamMember, HistoryMilestone, JobVacancy,
} from "../../types";
import { schema } from "../../content.schema";

type Row = any[];
type Cell = (row: Row, header: string) => string;

/** Baut einen header-namensbasierten Zellen-Getter (statt row[n]). */
function indexer(headerRow: Row, headers: readonly string[]): Cell {
  const map = new Map<string, number>();
  headers.forEach((h, fallback) => {
    const found = headerRow.findIndex((c) => String(c ?? "").trim() === h);
    map.set(h, found >= 0 ? found : fallback);
  });
  return (row, header) => {
    const i = map.get(header);
    const v = i === undefined ? undefined : row[i];
    return v === undefined || v === null ? "" : String(v);
  };
}

/** Header-Zeile (Index 0) und Datenzeilen (ab Index 1) eines Tabs trennen. */
function split(valueRanges: any[], tabIndex: number): { header: Row; data: Row[] } {
  const rows: Row[] = valueRanges[tabIndex]?.values || [];
  return { header: rows[0] || [], data: rows.slice(1) };
}

function splitList(value: string, sep: string): string[] {
  return value ? value.split(sep).map((s) => s.trim()).filter(Boolean) : [];
}

function decodeAllgemeines(vr: any[], seed: Record<string, string>): Record<string, string> {
  const e = schema.allgemeines;
  const { header, data } = split(vr, 0);
  const cell = indexer(header, e.columns);
  const out: Record<string, string> = { ...seed };
  data.forEach((row) => {
    const key = cell(row, e.columns[0]);
    const value = cell(row, e.columns[1]);
    if (key && value) out[key] = value;
  });
  return out;
}

function decodeServices(vr: any[], seeds: ServiceCategory[]): ServiceCategory[] {
  const c = schema.dienstleistungen.columns;
  const { header, data } = split(vr, 1);
  const cell = indexer(header, [
    c.categoryId.header, c.categoryTitle.header, c.categoryDescription.header,
    c.detailTitle.header, c.detailDescription.header, c.detailBullets.header,
  ]);
  const sep = c.detailBullets.listSeparator || ";";
  const byId = new Map<string, ServiceCategory>();

  data.forEach((row) => {
    const catId = cell(row, c.categoryId.header);
    if (!catId) return;
    const catTitle = cell(row, c.categoryTitle.header);
    const catDesc = cell(row, c.categoryDescription.header);
    const detTitle = cell(row, c.detailTitle.header);
    const detDesc = cell(row, c.detailDescription.header);
    const detBullets = cell(row, c.detailBullets.header);

    if (!byId.has(catId)) {
      // iconName/colorTheme sind Design (nicht im Sheet) → aus Seed übernehmen.
      const orig = seeds.find((s) => s.id === catId);
      byId.set(catId, {
        id: catId,
        title: catTitle || orig?.title || catId.toUpperCase(),
        iconName: orig?.iconName || "Bath",
        description: catDesc || orig?.description || "",
        details: [],
        colorTheme: orig?.colorTheme || {
          badge: "bg-stone-100 text-stone-700 border-stone-200",
          border: "border-stone-100", text: "text-stone-700", bg: "bg-stone-50", accent: "#ff4c00",
        },
      });
    } else {
      const existing = byId.get(catId)!;
      if (catTitle) existing.title = catTitle;
      if (catDesc) existing.description = catDesc;
    }

    if (detTitle) {
      byId.get(catId)!.details.push({
        id: detTitle.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        title: detTitle,
        description: detDesc || "",
        bullets: splitList(detBullets, sep),
      });
    }
  });

  if (byId.size === 0) return [];
  // Reihenfolge: Seed-Reihenfolge zuerst, danach neu hinzugekommene IDs.
  const out: ServiceCategory[] = [];
  const seedOrder = seeds.map((s) => s.id);
  seedOrder.forEach((id) => { const cat = byId.get(id); if (cat) out.push(cat); });
  byId.forEach((cat, id) => { if (!seedOrder.includes(id)) out.push(cat); });
  return out;
}

function decodeTeam(vr: any[]): TeamMember[] {
  const e = schema.team;
  const { header, data } = split(vr, 2);
  const cell = indexer(header, e.columns.map((c) => c.header));
  const out: TeamMember[] = [];
  data.forEach((row) => {
    const name = cell(row, "Name");
    if (!name) return;
    const yearRaw = Number(cell(row, "Dienstjahr (z.B. 1998)") || "2000");
    const imageUrl = cell(row, "Bild-URL (Optional)");
    out.push({
      name,
      role: cell(row, "Rolle / Jobbezeichnung"),
      quote: cell(row, "Persönliches Zitat"),
      description: cell(row, "Biografie (Absatz)"),
      experienceYear: isNaN(yearRaw) ? 2000 : yearRaw,
      imageUrl: imageUrl || undefined,
    });
  });
  return out;
}

function decodeHistorie(vr: any[]): HistoryMilestone[] {
  const e = schema.historie;
  const { header, data } = split(vr, 3);
  const cell = indexer(header, e.columns.map((c) => c.header));
  const out: HistoryMilestone[] = [];
  data.forEach((row) => {
    const yearRaw = Number(cell(row, "Jahr") || "1981");
    const year = isNaN(yearRaw) ? 1981 : yearRaw;
    if (!year) return;
    out.push({
      year,
      title: cell(row, "Ereignis-Überschrift"),
      description: cell(row, "Ausführliche Erläuterung"),
    });
  });
  return out;
}

function decodeJobs(vr: any[]): JobVacancy[] {
  const e = schema.jobs;
  const { header, data } = split(vr, 4);
  const cell = indexer(header, e.columns.map((c) => c.header));
  const out: JobVacancy[] = [];
  data.forEach((row) => {
    const title = cell(row, "Stellenbezeichnung");
    if (!title) return;
    const id = cell(row, "ID");
    out.push({
      id: id || title.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      title,
      type: cell(row, "Anstellung & Typ"),
      intro: cell(row, "Einleitungssatz"),
      requirements: splitList(cell(row, "Anforderungen (mit Semikolon ; trennen)"), ";"),
      benefits: splitList(cell(row, "Unternehmensvorteile (mit Semikolon ; trennen)"), ";"),
    });
  });
  return out;
}

/**
 * Dekodiert die batchGet-`valueRanges` (inkl. Header-Zeile) → CMSContent.
 * `seeds` liefert Fallback bei leeren Sektionen + Service-Styling (iconName/colorTheme).
 * Verhalten ist funktional identisch zur alten fetchCMS_Data, nur header- statt positionsbasiert.
 */
export function decodeContent(valueRanges: any[], seeds: CMSContent): CMSContent {
  const allgemeines = decodeAllgemeines(valueRanges, seeds.allgemeines);
  const team = decodeTeam(valueRanges);
  const historie = decodeHistorie(valueRanges);
  const dienstleistungen = decodeServices(valueRanges, seeds.dienstleistungen);
  const jobs = decodeJobs(valueRanges);

  return {
    allgemeines: Object.keys(allgemeines).length > 0 ? allgemeines : seeds.allgemeines,
    team: team.length > 0 ? team : seeds.team,
    historie: historie.length > 0 ? historie : seeds.historie,
    dienstleistungen: dienstleistungen.length > 0 ? dienstleistungen : seeds.dienstleistungen,
    jobs: jobs.length > 0 ? jobs : seeds.jobs,
  };
}
