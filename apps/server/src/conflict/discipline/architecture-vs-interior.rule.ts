import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class ArchitectureVsInteriorRule implements ConflictRule {
  name = "Architecture vs Interior Rule";
  category = "DISCIPLINE" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const targetDrawing = context.drawing;
    const targetId = context.drawingId;
    const allDrawings = context.allDrawings || [];

    const targetDiscipline = targetDrawing.metadata?.discipline || "";

    const architecturalDrawings: any[] = [];
    const interiorDrawings: any[] = [];

    if (targetDiscipline.toUpperCase() === "ARCHITECTURAL") {
      architecturalDrawings.push({ drawing: targetDrawing, id: targetId });
    } else if (targetDiscipline.toUpperCase() === "INTERIOR") {
      interiorDrawings.push({ drawing: targetDrawing, id: targetId });
    }

    for (const d of allDrawings) {
      const disc = (d.discipline || d.drawing.metadata?.discipline || "").toUpperCase();
      if (disc === "ARCHITECTURAL" && targetId !== d.id) {
        architecturalDrawings.push(d);
      } else if (disc === "INTERIOR" && targetId !== d.id) {
        interiorDrawings.push(d);
      }
    }

    for (const arch of architecturalDrawings) {
      for (const interior of interiorDrawings) {
        const archDoors = arch.drawing.openings?.doors || [];
        const archWindows = arch.drawing.openings?.windows || [];
        const interiorFixtures = interior.drawing.fixtures || [];

        const furniture = interiorFixtures.filter(
          (f: any) => f.type === "FURNITURE" || f.type === "APPLIANCE" || !f.type
        );

        for (const item of furniture) {
          const itemBBox = parseBBox(item.bbox || item.geometry);
          if (!itemBBox) continue;

          // Check if interior furniture blocks architectural doors
          for (const door of archDoors) {
            const doorBBox = parseBBox(door.bbox || door.geometry);
            if (doorBBox && intersects(itemBBox, doorBBox)) {
              conflicts.push({
                id: randomUUID(),
                category: this.category,
                severity: "HIGH",
                title: "Wardrobe/Furniture Blocks Doorway",
                description: `Interior fixture "${item.name}" from drawing "${interior.id}" blocks Architectural Door "${door.id}" from drawing "${arch.id}".`,
                entityA: `Furniture [Name: ${item.name}, Drawing: ${interior.id}]`,
                entityB: `Door [ID: ${door.id}, Drawing: ${arch.id}]`,
                recommendation: "Relocate the interior wardrobe or adjust door swing placement.",
              });
            }
          }

          // Check if interior furniture blocks architectural windows
          for (const win of archWindows) {
            const winBBox = parseBBox(win.bbox || win.geometry);
            if (winBBox && intersects(itemBBox, winBBox)) {
              conflicts.push({
                id: randomUUID(),
                category: this.category,
                severity: "MEDIUM",
                title: "Interior Furniture Blocks Window",
                description: `Interior fixture "${item.name}" from drawing "${interior.id}" blocks Architectural Window "${win.id}" from drawing "${arch.id}".`,
                entityA: `Furniture [Name: ${item.name}, Drawing: ${interior.id}]`,
                entityB: `Window [ID: ${win.id}, Drawing: ${arch.id}]`,
                recommendation: "Ensure furniture heights do not block window glazing or egress requirements.",
              });
            }
          }
        }
      }
    }

    return conflicts;
  }
}
