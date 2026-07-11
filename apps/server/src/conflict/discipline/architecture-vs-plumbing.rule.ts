import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class ArchitectureVsPlumbingRule implements ConflictRule {
  name = "Architecture vs Plumbing Rule";
  category = "DISCIPLINE" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const targetDrawing = context.drawing;
    const targetId = context.drawingId;
    const allDrawings = context.allDrawings || [];

    const targetDiscipline = targetDrawing.metadata?.discipline || "";

    const architecturalDrawings: any[] = [];
    const plumbingDrawings: any[] = [];

    if (targetDiscipline.toUpperCase() === "ARCHITECTURAL") {
      architecturalDrawings.push({ drawing: targetDrawing, id: targetId });
    } else if (targetDiscipline.toUpperCase() === "PLUMBING" || targetDiscipline.toUpperCase() === "MEP") {
      plumbingDrawings.push({ drawing: targetDrawing, id: targetId });
    }

    for (const d of allDrawings) {
      const disc = (d.discipline || d.drawing.metadata?.discipline || "").toUpperCase();
      if (disc === "ARCHITECTURAL" && targetId !== d.id) {
        architecturalDrawings.push(d);
      } else if ((disc === "PLUMBING" || disc === "MEP" || disc === "PLUMBING") && targetId !== d.id) {
        plumbingDrawings.push(d);
      }
    }

    for (const arch of architecturalDrawings) {
      for (const plumb of plumbingDrawings) {
        if (arch.id !== targetId && plumb.id !== targetId) continue;
        const archPlumbFixtures = (arch.drawing.fixtures || []).filter(
          (f: any) => f.type === "PLUMBING" || String(f.name).toLowerCase().includes("sink") || String(f.name).toLowerCase().includes("toilet")
        );

        const plumbFixtures = plumb.drawing.fixtures || [];

        // Check if sink / toilet shown in Architectural is missing in Plumbing drawing
        for (const archFix of archPlumbFixtures) {
          const archNameLower = String(archFix.name).toLowerCase();
          
          let matchFound = false;

          // Check if there is a fixture in the plumbing drawing with a similar name/location
          for (const plumbFix of plumbFixtures) {
            const plumbNameLower = String(plumbFix.name).toLowerCase();
            if (
              plumbNameLower.includes(archNameLower) ||
              archNameLower.includes(plumbNameLower)
            ) {
              // Check coordinate alignment if bboxes exist
              const archBBox = parseBBox(archFix.bbox) || parseBBox(archFix.geometry);
              const plumbBBox = parseBBox(plumbFix.bbox) || parseBBox(plumbFix.geometry);
              if (archBBox && plumbBBox) {
                if (intersects(archBBox, plumbBBox)) {
                  matchFound = true;
                  break;
                }
              } else {
                // If no coordinates, match semantically on location keywords
                const archLoc = String(archFix.location || "").toLowerCase();
                const plumbLoc = String(plumbFix.location || "").toLowerCase();
                if (archLoc === plumbLoc || archLoc.includes(plumbLoc) || plumbLoc.includes(archLoc)) {
                  matchFound = true;
                  break;
                }
              }
            }
          }

          if (!matchFound) {
            conflicts.push({
              id: randomUUID(),
              category: this.category,
              severity: "HIGH",
              title: "Sink/Fixture Missing in Plumbing Drawing",
              description: `Plumbing fixture "${archFix.name}" at location "${archFix.location || "unknown"}" in Architectural drawing "${arch.id}" is missing or mismatched in Plumbing/MEP drawing "${plumb.id}".`,
              entityA: `Fixture [Name: ${archFix.name}, Drawing: ${arch.id}]`,
              entityB: `Plumbing Drawing [ID: ${plumb.id}]`,
              recommendation: "Ensure all plumbing fixtures shown on architectural layouts are integrated into plumbing schematics with corresponding supply/waste piping connections.",
            });
          }
        }
      }
    }

    return conflicts;
  }
}
