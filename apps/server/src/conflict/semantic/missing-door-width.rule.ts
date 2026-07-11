import { ConflictRule, Conflict } from "../../models/conflict.types";
import { randomUUID } from "crypto";

export class MissingDoorWidthRule implements ConflictRule {
  name = "Missing Door Width Rule";
  category = "SEMANTIC" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const doors = context.drawing.openings?.doors || [];

    for (const door of doors) {
      const hasWidth = door.width && door.width.trim() !== "" && door.width.trim().toLowerCase() !== "null";
      if (!hasWidth) {
        conflicts.push({
          id: randomUUID(),
          category: this.category,
          severity: "MEDIUM",
          title: "Missing Door Width",
          description: `Door "${door.id}" at location "${door.location || "unknown"}" is missing its width dimension.`,
          entityA: `Door [ID: ${door.id}]`,
          recommendation: "Provide a width callout (e.g. 3'-0\" or 36\") in the drawing or door schedule.",
        });
      }
    }

    return conflicts;
  }
}
