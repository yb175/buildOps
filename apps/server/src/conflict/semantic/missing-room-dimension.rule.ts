import { ConflictRule, Conflict } from "../../models/conflict.types";
import { randomUUID } from "crypto";

export class MissingRoomDimensionRule implements ConflictRule {
  name = "Missing Room Dimension Rule";
  category = "SEMANTIC" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const rooms = context.drawing.rooms || [];

    for (const room of rooms) {
      const hasDimensions = room.dimensions && room.dimensions.trim() !== "";
      const hasArea = room.areaSquareFeet !== undefined && room.areaSquareFeet !== null;

      if (!hasDimensions && !hasArea) {
        conflicts.push({
          id: randomUUID(),
          category: this.category,
          severity: "MEDIUM",
          title: "Missing Room Dimensions and Area",
          description: `Room "${room.name}" has no dimensions or area defined in the drawing JSON.`,
          entityA: `Room [ID: ${room.id || "N/A"}, Name: ${room.name}]`,
          recommendation: "Update the drawing to include either specific dimension callouts (e.g. 12'-0\" x 10'-0\") or total area in square feet.",
        });
      } else if (!hasDimensions) {
        conflicts.push({
          id: randomUUID(),
          category: this.category,
          severity: "LOW",
          title: "Missing Room Dimensions",
          description: `Room "${room.name}" specifies area (${room.areaSquareFeet} sq ft) but lacks linear dimensions.`,
          entityA: `Room [ID: ${room.id || "N/A"}, Name: ${room.name}]`,
          recommendation: "Provide linear dimension callouts for room boundaries.",
        });
      }
    }

    return conflicts;
  }
}
