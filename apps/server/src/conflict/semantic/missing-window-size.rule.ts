import { ConflictRule, Conflict } from "../../models/conflict.types";
import { randomUUID } from "crypto";

export class MissingWindowSizeRule implements ConflictRule {
  name = "Missing Window Size Rule";
  category = "SEMANTIC" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const windows = context.drawing.openings?.windows || [];

    for (const window of windows) {
      const hasWidth = window.width && window.width.trim() !== "" && window.width.trim().toLowerCase() !== "null";
      const hasHeight = window.height && window.height.trim() !== "" && window.height.trim().toLowerCase() !== "null";

      if (!hasWidth || !hasHeight) {
        let missing = "";
        if (!hasWidth && !hasHeight) missing = "width and height";
        else if (!hasWidth) missing = "width";
        else missing = "height";

        conflicts.push({
          id: randomUUID(),
          category: this.category,
          severity: "MEDIUM",
          title: "Missing Window Dimensions",
          description: `Window "${window.id}" at location "${window.location || "unknown"}" is missing its ${missing}.`,
          entityA: `Window [ID: ${window.id}]`,
          recommendation: "Provide complete size dimensions (e.g. 4'-0\" x 5'-0\") in the drawing or window schedule.",
        });
      }
    }

    return conflicts;
  }
}
