import { ConflictRule, Conflict } from "../../models/conflict.types";
import { randomUUID } from "crypto";

export class MetadataRule implements ConflictRule {
  name = "Drawing Metadata Rule";
  category = "SEMANTIC" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const metadata = context.drawing.metadata || {};

    const criticalFields = ["drawingNumber", "title"];
    const standardFields = ["project", "scale", "date", "discipline"];

    for (const field of criticalFields) {
      if (!metadata[field] || String(metadata[field]).trim() === "" || String(metadata[field]).trim().toLowerCase() === "null") {
        conflicts.push({
          id: randomUUID(),
          category: this.category,
          severity: "HIGH",
          title: `Missing Key Metadata: ${field}`,
          description: `The drawing title block does not define the critical metadata field "${field}".`,
          entityA: "Drawing Metadata",
          recommendation: `Locate the title block and populate the missing "${field}" value to ensure correct routing and tracking.`,
        });
      }
    }

    for (const field of standardFields) {
      if (!metadata[field] || String(metadata[field]).trim() === "" || String(metadata[field]).trim().toLowerCase() === "null") {
        conflicts.push({
          id: randomUUID(),
          category: this.category,
          severity: "LOW",
          title: `Missing Metadata: ${field}`,
          description: `The drawing metadata field "${field}" is not specified in the title block.`,
          entityA: "Drawing Metadata",
          recommendation: `Check the standard sheet info blocks and add the "${field}" parameter if applicable.`,
        });
      }
    }

    return conflicts;
  }
}
