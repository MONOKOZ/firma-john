/**
 * validate.ts — zentrale Limit-Validierung gegen content.schema.ts.
 *
 * Master-Engine. Eine Quelle für Client (UX, Save-Gate) UND Server (Sicherheit,
 * M4/M5). Ersetzt die ~25× im JSX verstreuten Limit-Zahlen. Liefert strukturierte
 * Fehler, damit das Admin-Formular pro Feld rot markieren kann (Formular-Stil:
 * Save feuert nicht, solange Fehler bestehen — §8-Entscheidung #3).
 */
import type { CMSContent } from "../../types";
import { schema } from "../../content.schema";

export interface ValidationError {
  entity: string;
  field: string;
  /** Listen-Index (Team/Historie/Jobs/Service-Detail), falls zutreffend. */
  index?: number;
  label: string;
  limit: number;
  current: number;
  message: string;
}

function check(
  errors: ValidationError[],
  entity: string, field: string, label: string,
  value: string, limit?: number, index?: number,
): void {
  if (limit !== undefined && value.length > limit) {
    errors.push({
      entity, field, index, label, limit, current: value.length,
      message: `${label}: max. ${limit} Zeichen (aktuell ${value.length}).`,
    });
  }
}

/** Prüft den gesamten Content gegen die Schema-Limits. Leeres Array = gültig. */
export function validate(content: CMSContent): ValidationError[] {
  const errors: ValidationError[] = [];

  // Allgemeines (Key-Value)
  for (const [key, spec] of Object.entries(schema.allgemeines.fields)) {
    check(errors, "allgemeines", key, spec.label, content.allgemeines[key] || "", spec.limit);
  }

  // Dienstleistungen (Kategorie + Details)
  const sc = schema.dienstleistungen.columns;
  content.dienstleistungen.forEach((cat, ci) => {
    check(errors, "dienstleistungen", "categoryTitle", sc.categoryTitle.label, cat.title || "", sc.categoryTitle.limit, ci);
    check(errors, "dienstleistungen", "categoryDescription", sc.categoryDescription.label, cat.description || "", sc.categoryDescription.limit, ci);
    cat.details.forEach((det, di) => {
      check(errors, "dienstleistungen", "detailTitle", sc.detailTitle.label, det.title || "", sc.detailTitle.limit, di);
      check(errors, "dienstleistungen", "detailDescription", sc.detailDescription.label, det.description || "", sc.detailDescription.limit, di);
    });
  });

  // Listen-Entitäten (Team / Historie / Jobs)
  const lists = [
    { name: "team", entity: schema.team, items: content.team as any[] },
    { name: "historie", entity: schema.historie, items: content.historie as any[] },
    { name: "jobs", entity: schema.jobs, items: content.jobs as any[] },
  ];
  for (const { name, entity, items } of lists) {
    items.forEach((item, idx) => {
      entity.columns.forEach((col) => {
        if (col.limit === undefined || col.type === "list") return;
        const v = item[col.key];
        check(errors, name, col.key, col.label, v == null ? "" : String(v), col.limit, idx);
      });
    });
  }

  return errors;
}
