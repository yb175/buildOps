import { ConflictRule, Conflict } from "../../models/conflict.types";
import { randomUUID } from "crypto";

export class OrphanReferenceRule implements ConflictRule {
  name = "Orphan Reference Rule";
  category = "SEMANTIC" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const annotations = drawing.annotations || [];

    // Collect existing entity identifiers
    const doorIds = new Set((drawing.openings?.doors || []).map((d: any) => String(d.id).trim().toLowerCase()));
    const windowIds = new Set((drawing.openings?.windows || []).map((w: any) => String(w.id).trim().toLowerCase()));

    // Helper to check standard labels
    const checkText = (text: string, source: string) => {
      // Look for door references e.g. D1, D01, D-1
      const doorMatches = text.match(/\b(D[- ]?\d+)\b/gi);
      if (doorMatches) {
        for (const match of doorMatches) {
          const cleanMatch = match.replace(/[- ]/g, "").toLowerCase();
          if (!doorIds.has(cleanMatch)) {
            conflicts.push({
              id: randomUUID(),
              category: this.category,
              severity: "MEDIUM",
              title: "Orphaned Door Reference",
              description: `A reference to Door "${match}" is found in ${source}, but no door with this ID exists in the openings list.`,
              entityA: `${source} Text: "${text}"`,
              recommendation: `Verify if Door "${match}" was omitted from the plan layout or has a typing error.`,
            });
          }
        }
      }

      // Look for window references e.g. W1, W01, W-1
      const windowMatches = text.match(/\b(W[- ]?\d+)\b/gi);
      if (windowMatches) {
        for (const match of windowMatches) {
          const cleanMatch = match.replace(/[- ]/g, "").toLowerCase();
          if (!windowIds.has(cleanMatch)) {
            conflicts.push({
              id: randomUUID(),
              category: this.category,
              severity: "MEDIUM",
              title: "Orphaned Window Reference",
              description: `A reference to Window "${match}" is found in ${source}, but no window with this ID exists in the openings list.`,
              entityA: `${source} Text: "${text}"`,
              recommendation: `Verify if Window "${match}" was omitted from the plan layout or has a typing error.`,
            });
          }
        }
      }
    };

    // Scan annotations
    for (const ann of annotations) {
      if (ann.text) {
        checkText(ann.text, "Annotation");
      }
    }

    // Scan notes
    const notes = drawing.notes || [];
    for (const note of notes) {
      checkText(note, "General Notes");
    }

    return conflicts;
  }
}
