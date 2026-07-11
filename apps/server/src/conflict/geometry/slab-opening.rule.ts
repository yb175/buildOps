import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, contains } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class SlabOpeningRule implements ConflictRule {
  name = "Slab Opening Geometry Rule";
  category = "GEOMETRY" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const slabs = drawing.structural?.slabs || [];

    // Let's assume annotations or note callouts describing shaft or slab openings exist
    const annotations = drawing.annotations || [];
    const slabOpenings: any[] = [];

    // Extract any annotation representing a slab opening or shaft
    for (const ann of annotations) {
      if (ann.text && (ann.text.toLowerCase().includes("shaft") || ann.text.toLowerCase().includes("slab opening") || ann.text.toLowerCase().includes("penetration"))) {
        slabOpenings.push(ann);
      }
    }

    for (const slab of slabs) {
      const slabBBox = parseBBox(slab.bbox || slab.geometry);
      if (!slabBBox) continue;

      for (const opening of slabOpenings) {
        const opBBox = parseBBox(opening.bbox || opening.geometry || opening.location);
        if (!opBBox) continue;

        // If slab opening is not contained within the slab boundaries, flag it
        if (!contains(slabBBox, opBBox)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Slab Opening Outside Slab Boundary",
            description: `Slab opening/shaft "${opening.text}" is not fully contained within the slab "${slab.id}".`,
            entityA: `Slab [ID: ${slab.id}]`,
            entityB: `Opening [Text: "${opening.text}"]`,
            recommendation: "Reposition the opening or adjust slab dimensions to ensure the opening lies fully inside the slab geometry.",
          });
        }
      }
    }

    return conflicts;
  }
}
