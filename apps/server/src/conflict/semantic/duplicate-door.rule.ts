import { ConflictRule, Conflict } from "../../models/conflict.types";
import { randomUUID } from "crypto";

export class DuplicateDoorRule implements ConflictRule {
  name = "Duplicate Door Rule";
  category = "SEMANTIC" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const doors = context.drawing.openings?.doors || [];

    const idsSeen = new Map<string, any>();
    const locationsSeen = new Map<string, any>();

    for (const door of doors) {
      if (!door.id) continue;
      const normalizedId = String(door.id).trim().toLowerCase();
      const normalizedLoc = door.location ? String(door.location).trim().toLowerCase() : "";

      // Check duplicate ID
      if (idsSeen.has(normalizedId)) {
        const firstDoor = idsSeen.get(normalizedId);
        conflicts.push({
          id: randomUUID(),
          category: this.category,
          severity: "HIGH",
          title: "Duplicate Door ID Detected",
          description: `Door ID "${door.id}" is assigned multiple times. Every door swing must have a unique identifier.`,
          entityA: `Door [ID: ${firstDoor.id}, Location: ${firstDoor.location || "N/A"}]`,
          entityB: `Door [ID: ${door.id}, Location: ${door.location || "N/A"}]`,
          recommendation: "Ensure unique numbering for doors (e.g., D101, D102).",
        });
      } else {
        idsSeen.set(normalizedId, door);
      }

      // Check duplicate location (semantic heuristic)
      if (normalizedLoc && normalizedLoc !== "null" && normalizedLoc !== "undefined") {
        if (locationsSeen.has(normalizedLoc)) {
          const firstDoor = locationsSeen.get(normalizedLoc);
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "MEDIUM",
            title: "Multiple Doors at Same Location",
            description: `Multiple doors are registered at location "${door.location}".`,
            entityA: `Door [ID: ${firstDoor.id}]`,
            entityB: `Door [ID: ${door.id}]`,
            recommendation: "Verify if this is a double door swing configuration, and consolidate into a single 'double' door entry if appropriate.",
          });
        } else {
          locationsSeen.set(normalizedLoc, door);
        }
      }
    }

    return conflicts;
  }
}
