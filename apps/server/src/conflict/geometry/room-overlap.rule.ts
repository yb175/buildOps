import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class RoomOverlapRule implements ConflictRule {
  name = "Room Overlap Geometry Rule";
  category = "GEOMETRY" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const rooms = drawing.rooms || [];

    for (let i = 0; i < rooms.length; i++) {
      const roomA = rooms[i];
      const bboxA = parseBBox(roomA.bbox || roomA.geometry);
      if (!bboxA) continue;

      for (let j = i + 1; j < rooms.length; j++) {
        const roomB = rooms[j];
        const bboxB = parseBBox(roomB.bbox || roomB.geometry);
        if (!bboxB) continue;

        if (intersects(bboxA, bboxB)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Room Overlap Detected",
            description: `Room boundaries for "${roomA.name}" and "${roomB.name}" overlap, which suggests a drafting or zoning error.`,
            entityA: `Room [ID: ${roomA.id || "N/A"}, Name: ${roomA.name}]`,
            entityB: `Room [ID: ${roomB.id || "N/A"}, Name: ${roomB.name}]`,
            recommendation: "Review the room boundaries and dimensions in the layout drawing to separate their areas.",
          });
        }
      }
    }

    return conflicts;
  }
}
