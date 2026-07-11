import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class HvacRule implements ConflictRule {
  name = "HVAC Geometry Rule";
  category = "GEOMETRY" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const fixtures = drawing.fixtures || [];
    const beams = drawing.structural?.beams || [];
    const columns = drawing.structural?.columns || [];

    // Filter HVAC/MEP fixtures
    const hvacFixtures = fixtures.filter((f: any) => {
      const name = String(f.name || "").toLowerCase();
      const type = String(f.type || "").toLowerCase();
      return (
        name.includes("duct") ||
        name.includes("hvac") ||
        name.includes("ac unit") ||
        name.includes("diffuser") ||
        name.includes("exhaust fan") ||
        type.includes("hvac") ||
        type.includes("duct") ||
        type.includes("diffuser") ||
        type.includes("vav")
      );
    });

    for (const duct of hvacFixtures) {
      const ductBBox = parseBBox(duct.bbox || duct.geometry);
      if (!ductBBox) continue;

      // Check beams
      for (const beam of beams) {
        const beamBBox = parseBBox(beam.bbox || beam.geometry);
        if (beamBBox && intersects(ductBBox, beamBBox)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "HVAC Duct Intersects Structural Beam",
            description: `HVAC component "${duct.name}" clashes with structural beam "${beam.id}".`,
            entityA: `HVAC [Name: ${duct.name}]`,
            entityB: `Beam [ID: ${beam.id}]`,
            recommendation: "Re-route the HVAC duct below or around the beam, or design a structural penetration sleeve if structurally permissible.",
          });
        }
      }

      // Check columns
      for (const col of columns) {
        const colBBox = parseBBox(col.bbox || col.geometry);
        if (colBBox && intersects(ductBBox, colBBox)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "CRITICAL",
            title: "HVAC Duct Intersects Column",
            description: `HVAC component "${duct.name}" clashes with structural column "${col.id}".`,
            entityA: `HVAC [Name: ${duct.name}]`,
            entityB: `Column [ID: ${col.id}]`,
            recommendation: "Re-route HVAC services completely away from structural columns. No penetrations through columns are allowed.",
          });
        }
      }
    }

    return conflicts;
  }
}
