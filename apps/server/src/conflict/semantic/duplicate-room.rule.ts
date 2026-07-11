import { ConflictRule, Conflict } from "../../models/conflict.types";
import { randomUUID } from "crypto";

export class DuplicateRoomRule implements ConflictRule {
  name = "Duplicate Room Rule";
  category = "SEMANTIC" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const rooms = context.drawing.rooms || [];

    const namesSeen = new Map<string, any>();
    const numbersSeen = new Map<string, any>();

    for (const room of rooms) {
      const normalizedName = room.name ? String(room.name).trim().toLowerCase() : "";
      const normalizedNumber = room.number ? String(room.number).trim().toLowerCase() : "";

      // Check name duplicates
      if (normalizedName) {
        if (namesSeen.has(normalizedName)) {
          const firstRoom = namesSeen.get(normalizedName);
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "MEDIUM",
            title: "Duplicate Room Name Detected",
            description: `Multiple rooms are named "${room.name}". This can cause confusion in schedules and construction layouts.`,
            entityA: `Room [ID: ${firstRoom.id || "N/A"}, Name: ${firstRoom.name}]`,
            entityB: `Room [ID: ${room.id || "N/A"}, Name: ${room.name}]`,
            recommendation: "Ensure each room has a unique name or number designation (e.g. Office 101, Office 102).",
          });
        } else {
          namesSeen.set(normalizedName, room);
        }
      }

      // Check number duplicates
      if (normalizedNumber && normalizedNumber !== "null" && normalizedNumber !== "undefined") {
        if (numbersSeen.has(normalizedNumber)) {
          const firstRoom = numbersSeen.get(normalizedNumber);
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Duplicate Room Number Detected",
            description: `Room number "${room.number}" is assigned to multiple rooms: "${firstRoom.name}" and "${room.name}".`,
            entityA: `Room [ID: ${firstRoom.id || "N/A"}, Number: ${firstRoom.number}]`,
            entityB: `Room [ID: ${room.id || "N/A"}, Number: ${room.number}]`,
            recommendation: "Re-assign unique room numbers according to the drawing index or architectural pattern.",
          });
        } else {
          numbersSeen.set(normalizedNumber, room);
        }
      }
    }

    return conflicts;
  }
}
