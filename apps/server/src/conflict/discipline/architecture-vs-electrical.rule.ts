import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class ArchitectureVsElectricalRule implements ConflictRule {
  name = "Architecture vs Electrical Rule";
  category = "DISCIPLINE" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const targetDrawing = context.drawing;
    const targetId = context.drawingId;
    const allDrawings = context.allDrawings || [];

    const targetDiscipline = targetDrawing.metadata?.discipline || "";

    const architecturalDrawings: any[] = [];
    const electricalDrawings: any[] = [];

    if (targetDiscipline.toUpperCase() === "ARCHITECTURAL") {
      architecturalDrawings.push({ drawing: targetDrawing, id: targetId });
    } else if (targetDiscipline.toUpperCase() === "ELECTRICAL" || targetDiscipline.toUpperCase() === "MEP") {
      electricalDrawings.push({ drawing: targetDrawing, id: targetId });
    }

    for (const d of allDrawings) {
      const disc = (d.discipline || d.drawing.metadata?.discipline || "").toUpperCase();
      if (disc === "ARCHITECTURAL" && targetId !== d.id) {
        architecturalDrawings.push(d);
      } else if ((disc === "ELECTRICAL" || disc === "MEP") && targetId !== d.id) {
        electricalDrawings.push(d);
      }
    }

    for (const arch of architecturalDrawings) {
      for (const elec of electricalDrawings) {
        if (arch.id !== targetId && elec.id !== targetId) continue;
        const archDoors = arch.drawing.openings?.doors || [];
        const archWindows = arch.drawing.openings?.windows || [];
        const elecFixtures = elec.drawing.fixtures || [];

        // Check if electrical fixtures (panels, switchboards) clash with architectural openings
        const panels = elecFixtures.filter(
          (f: any) =>
            String(f.name).toLowerCase().includes("panel") ||
            String(f.name).toLowerCase().includes("switchboard") ||
            String(f.type).toLowerCase().includes("electrical")
        );

        for (const panel of panels) {
          const panelBBox = parseBBox(panel.bbox) || parseBBox(panel.geometry);
          if (!panelBBox) continue;

          for (const door of archDoors) {
            const doorBBox = parseBBox(door.bbox) || parseBBox(door.geometry);
            if (doorBBox && intersects(panelBBox, doorBBox)) {
              conflicts.push({
                id: randomUUID(),
                category: this.category,
                severity: "HIGH",
                title: "Electrical Panel Blocks Architectural Doorway",
                description: `Electrical Panel "${panel.name}" from drawing "${elec.id}" blocks Architectural Door "${door.id}" doorway swing path from drawing "${arch.id}".`,
                entityA: `Electrical Panel [Name: ${panel.name}, Drawing: ${elec.id}]`,
                entityB: `Door [ID: ${door.id}, Drawing: ${arch.id}]`,
                recommendation: "Ensure 36 inches working clearance in front of panels and clear egress paths.",
              });
            }
          }

          for (const win of archWindows) {
            const winBBox = parseBBox(win.bbox) || parseBBox(win.geometry);
            if (winBBox && intersects(panelBBox, winBBox)) {
              conflicts.push({
                id: randomUUID(),
                category: this.category,
                severity: "HIGH",
                title: "Electrical Panel Clashes with Window",
                description: `Electrical Panel "${panel.name}" from drawing "${elec.id}" overlaps Architectural Window "${win.id}" from drawing "${arch.id}".`,
                entityA: `Electrical Panel [Name: ${panel.name}, Drawing: ${elec.id}]`,
                entityB: `Window [ID: ${win.id}, Drawing: ${arch.id}]`,
                recommendation: "Move electrical panel to a solid wall surface; panels cannot be mounted on windows.",
              });
            }
          }
        }
      }
    }

    return conflicts;
  }
}
