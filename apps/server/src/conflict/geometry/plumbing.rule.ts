import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class PlumbingRule implements ConflictRule {
  name = "Plumbing Geometry Rule";
  category = "GEOMETRY" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const fixtures = drawing.fixtures || [];
    const beams = drawing.structural?.beams || [];

    // Filter plumbing/pipes
    const plumbingFixtures = fixtures.filter((f: any) => {
      const name = String(f.name || "").toLowerCase();
      const type = String(f.type || "").toLowerCase();
      return (
        name.includes("pipe") ||
        name.includes("drain") ||
        name.includes("riser") ||
        name.includes("sewer") ||
        name.includes("water line") ||
        type.includes("plumbing")
      );
    });

    for (const pipe of plumbingFixtures) {
      const pipeBBox = parseBBox(pipe.bbox || pipe.geometry);
      if (!pipeBBox) continue;

      for (const beam of beams) {
        const beamBBox = parseBBox(beam.bbox || beam.geometry);
        if (beamBBox && intersects(pipeBBox, beamBBox)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Plumbing Pipe Penetrates Beam",
            description: `Plumbing fixture/pipe "${pipe.name}" intersects structural beam "${beam.id}".`,
            entityA: `Pipe [Name: ${pipe.name}]`,
            entityB: `Beam [ID: ${beam.id}]`,
            recommendation: "Ensure pipe routing is sleeved through the beam neutral axis following structural engineer specifications, or re-route below the slab.",
          });
        }
      }
    }

    return conflicts;
  }
}
