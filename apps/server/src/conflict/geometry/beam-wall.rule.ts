import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class BeamWallRule implements ConflictRule {
  name = "Beam Wall Geometry Rule";
  category = "GEOMETRY" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const beams = drawing.structural?.beams || [];
    const walls = drawing.structural?.walls || [];

    for (const beam of beams) {
      const beamBBox = parseBBox(beam.bbox || beam.geometry);
      if (!beamBBox) continue;

      for (const wall of walls) {
        const wallBBox = parseBBox(wall.bbox || wall.geometry);
        if (!wallBBox) continue;

        // If a beam intersects a PARTITION wall, it might be a layout clash or need header verification
        if (wall.type === "PARTITION" && intersects(beamBBox, wallBBox)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "LOW",
            title: "Beam Intersecting Partition Wall",
            description: `Beam "${beam.id}" intersects partition wall at location "${wall.location || "N/A"}".`,
            entityA: `Beam [ID: ${beam.id}]`,
            entityB: `Wall [Type: ${wall.type}]`,
            recommendation: "Ensure partition wall has adequate headroom clearance below the beam line.",
          });
        }
      }
    }

    return conflicts;
  }
}
