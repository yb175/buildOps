import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class WallDoorRule implements ConflictRule {
  name = "Wall Door Geometry Rule";
  category = "GEOMETRY" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const doors = drawing.openings?.doors || [];
    const walls = drawing.structural?.walls || [];

    const positiveAreaOverlap = (a: any, b: any) => {
      return a[2] > b[0] && a[0] < b[2] && a[3] > b[1] && a[1] < b[3];
    };

    // 1. Check for wall overlap
    for (let i = 0; i < walls.length; i++) {
      const wallA = walls[i];
      const bboxA = parseBBox(wallA.bbox) || parseBBox(wallA.geometry);
      if (!bboxA) continue;

      for (let j = i + 1; j < walls.length; j++) {
        const wallB = walls[j];
        const bboxB = parseBBox(wallB.bbox) || parseBBox(wallB.geometry);
        if (!bboxB) continue;

        if (positiveAreaOverlap(bboxA, bboxB)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "MEDIUM",
            title: "Wall Overlap Clash",
            description: `Two walls at location "${wallA.location || "N/A"}" and "${wallB.location || "N/A"}" overlap.`,
            entityA: `Wall [Index: ${i}, Type: ${wallA.type}]`,
            entityB: `Wall [Index: ${j}, Type: ${wallB.type}]`,
            recommendation: "Review wall layout and bounding boxes to ensure wall segments do not duplicate or overlap.",
          });
        }
      }
    }

    // 2. Check for door inside/clashing with load bearing walls (doors should serve openings, not block load-bearing walls)
    for (const door of doors) {
      const doorBBox = parseBBox(door.bbox) || parseBBox(door.geometry);

      for (const wall of walls) {
        if (wall.type === "LOAD_BEARING") {
          const wallBBox = parseBBox(wall.bbox) || parseBBox(wall.geometry);
          if (door.hostWallId === wall.id || door.parentWallId === wall.id) continue;
          if (doorBBox && wallBBox && intersects(doorBBox, wallBBox)) {
            conflicts.push({
              id: randomUUID(),
              category: this.category,
              severity: "HIGH",
              title: "Door Clashing with Load-Bearing Wall",
              description: `Door "${door.id}" intersects load-bearing wall at location "${wall.location || "unknown"}".`,
              entityA: `Door [ID: ${door.id}]`,
              entityB: `Wall [Location: ${wall.location}, Type: ${wall.type}]`,
              recommendation: "Ensure a lintel or opening reinforcement is provided, or relocate the door swing away from the load-bearing column/wall.",
            });
          }
        }
      }
    }

    // 3. Semantic fallback if no bboxes exist (per door)
    for (const door of doors) {
      const doorBBox = parseBBox(door.bbox) || parseBBox(door.geometry);
      if (!doorBBox) {
        if (door.location && String(door.location).toLowerCase().includes("load bearing")) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Door Semantically Placed in Load-Bearing Wall",
            description: `Door "${door.id}" location is described as "${door.location}", which indicates a structural clash with a load-bearing wall.`,
            entityA: `Door [ID: ${door.id}]`,
            recommendation: "Verify structural engineering drawing to ensure a proper opening is permitted in this wall.",
          });
        }
      }
    }

    return conflicts;
  }
}
