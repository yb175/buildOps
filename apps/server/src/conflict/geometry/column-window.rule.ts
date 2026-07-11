import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class ColumnWindowRule implements ConflictRule {
  name = "Column Window Geometry Rule";
  category = "GEOMETRY" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const windows = drawing.openings?.windows || [];
    const columns = drawing.structural?.columns || [];

    // Check if window intersects a column
    for (const window of windows) {
      const windowBBox = parseBBox(window.bbox || window.geometry);

      for (const column of columns) {
        const colBBox = parseBBox(column.bbox || column.geometry);

        if (windowBBox && colBBox && intersects(windowBBox, colBBox)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "CRITICAL",
            title: "Window inside Column Clash",
            description: `Window "${window.id}" geometry overlaps with structural column "${column.id}" at grid "${column.gridReference || "unknown"}".`,
            entityA: `Window [ID: ${window.id}]`,
            entityB: `Column [ID: ${column.id}, Grid: ${column.gridReference}]`,
            recommendation: "Relocate the window or column; windows cannot be placed through structural columns.",
          });
        }
      }
    }

    // Semantic fallback
    const hasCoordinates = windows.some((w: any) => w.bbox || w.geometry) || columns.some((c: any) => c.bbox || c.geometry);
    if (!hasCoordinates) {
      for (const window of windows) {
        const locLower = window.location ? window.location.toLowerCase() : "";
        if (locLower.includes("column") || locLower.includes("post") || locLower.includes("pillar")) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Window Semantically Located at Column",
            description: `Window "${window.id}" location description "${window.location}" indicates placement at a structural column.`,
            entityA: `Window [ID: ${window.id}]`,
            recommendation: "Verify structural details to ensure column does not block the window opening.",
          });
        }
      }
    }

    return conflicts;
  }
}
