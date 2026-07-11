import { ConflictRule, Conflict } from "../../models/conflict.types";
import { randomUUID } from "crypto";

export class DuplicateWindowRule implements ConflictRule {
  name = "Duplicate Window Rule";
  category = "SEMANTIC" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const windows = context.drawing.openings?.windows || [];

    const idsSeen = new Map<string, any>();

    for (const window of windows) {
      if (!window.id) continue;
      const normalizedId = String(window.id).trim().toLowerCase();

      // Check duplicate ID
      if (idsSeen.has(normalizedId)) {
        const firstWindow = idsSeen.get(normalizedId);
        conflicts.push({
          id: randomUUID(),
          category: this.category,
          severity: "HIGH",
          title: "Duplicate Window ID Detected",
          description: `Window ID "${window.id}" is assigned multiple times. Every window must have a unique identifier.`,
          entityA: `Window [ID: ${firstWindow.id}, Location: ${firstWindow.location || "N/A"}]`,
          entityB: `Window [ID: ${window.id}, Location: ${window.location || "N/A"}]`,
          recommendation: "Re-label the windows to ensure unique identifiers (e.g., W101, W102).",
        });
      } else {
        idsSeen.set(normalizedId, window);
      }
    }

    return conflicts;
  }
}
