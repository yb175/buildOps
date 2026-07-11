import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class BeamColumnRule implements ConflictRule {
  name = "Beam Column Geometry Rule";
  category = "GEOMETRY" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const beams = drawing.structural?.beams || [];
    const columns = drawing.structural?.columns || [];
    const walls = drawing.structural?.walls || [];

    for (const beam of beams) {
      const beamBBox = parseBBox(beam.bbox) || parseBBox(beam.geometry);
      
      if (beamBBox) {
        // Check if beam intersects any column or wall (at least one support is required)
        let hasSupport = false;

        for (const col of columns) {
          const colBBox = parseBBox(col.bbox) || parseBBox(col.geometry);
          if (colBBox && intersects(beamBBox, colBBox)) {
            hasSupport = true;
            break;
          }
        }

        if (!hasSupport) {
          // Check walls as alternative supports
          for (const wall of walls) {
            if (wall.type === "PARTITION") continue;
          const wallBBox = parseBBox(wall.bbox) || parseBBox(wall.geometry);
            if (wallBBox && intersects(beamBBox, wallBBox)) {
              hasSupport = true;
              break;
            }
          }
        }

        if (!hasSupport && (columns.length > 0 || walls.length > 0)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Beam Unsupported",
            description: `Beam "${beam.id}" does not intersect any structural column or wall. It appears floating or unsupported.`,
            entityA: `Beam [ID: ${beam.id}]`,
            recommendation: "Ensure beam ends rest on columns, load-bearing walls, or other support beams.",
          });
        }
      } else {
        // Semantic fallback: check if beam is described as unsupported or floating
        const noteLower = beam.span ? String(beam.span).toLowerCase() : "";
        const descLower = beam.id ? String(beam.id).toLowerCase() : "";
        if (noteLower.includes("unsupported") || descLower.includes("floating")) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Beam Semantically Unsupported",
            description: `Beam "${beam.id}" is designated or described as unsupported/floating in drawing metadata.`,
            entityA: `Beam [ID: ${beam.id}]`,
            recommendation: "Verify load-bearing structures and structural connections.",
          });
        }
      }
    }

    return conflicts;
  }
}
