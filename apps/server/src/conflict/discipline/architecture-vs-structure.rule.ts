import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class ArchitectureVsStructureRule implements ConflictRule {
  name = "Architecture vs Structure Rule";
  category = "DISCIPLINE" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const targetDrawing = context.drawing;
    const targetId = context.drawingId;
    const allDrawings = context.allDrawings || [];

    const targetDiscipline = targetDrawing.metadata?.discipline || "";

    // We compare ARCHITECTURAL vs STRUCTURAL
    const architecturalDrawings: any[] = [];
    const structuralDrawings: any[] = [];

    if (targetDiscipline.toUpperCase() === "ARCHITECTURAL") {
      architecturalDrawings.push({ drawing: targetDrawing, id: targetId });
    } else if (targetDiscipline.toUpperCase() === "STRUCTURAL") {
      structuralDrawings.push({ drawing: targetDrawing, id: targetId });
    }

    for (const d of allDrawings) {
      const disc = (d.discipline || d.drawing.metadata?.discipline || "").toUpperCase();
      if (disc === "ARCHITECTURAL" && targetId !== d.id) {
        architecturalDrawings.push(d);
      } else if (disc === "STRUCTURAL" && targetId !== d.id) {
        structuralDrawings.push(d);
      }
    }

    // Run comparison if we have at least one of each
    for (const arch of architecturalDrawings) {
      for (const struct of structuralDrawings) {
        if (arch.id !== targetId && struct.id !== targetId) continue;
        const archDoors = arch.drawing.openings?.doors || [];
        const archWindows = arch.drawing.openings?.windows || [];
        const structColumns = struct.drawing.structural?.columns || [];

        // Check door clashing with structural columns
        for (const door of archDoors) {
          const doorBBox = parseBBox(door.bbox) || parseBBox(door.geometry);
          if (!doorBBox) continue;

          for (const col of structColumns) {
            const colBBox = parseBBox(col.bbox) || parseBBox(col.geometry);
            if (colBBox && intersects(doorBBox, colBBox)) {
              conflicts.push({
                id: randomUUID(),
                category: this.category,
                severity: "CRITICAL",
                title: "Door intersects Structural Column",
                description: `Architectural Door "${door.id}" at location "${door.location || "N/A"}" intersects Structural Column "${col.id}" from drawing "${struct.id}".`,
                entityA: `Door [ID: ${door.id}, Drawing: ${arch.id}]`,
                entityB: `Column [ID: ${col.id}, Drawing: ${struct.id}]`,
                recommendation: "Relocate the door or adjust structural column placement to avoid clash with path of travel.",
              });
            }
          }
        }

        // Check window clashing with structural columns
        for (const win of archWindows) {
          const winBBox = parseBBox(win.bbox) || parseBBox(win.geometry);
          if (!winBBox) continue;

          for (const col of structColumns) {
            const colBBox = parseBBox(col.bbox) || parseBBox(col.geometry);
            if (colBBox && intersects(winBBox, colBBox)) {
              conflicts.push({
                id: randomUUID(),
                category: this.category,
                severity: "CRITICAL",
                title: "Window intersects Structural Column",
                description: `Architectural Window "${win.id}" at location "${win.location || "N/A"}" intersects Structural Column "${col.id}" from drawing "${struct.id}".`,
                entityA: `Window [ID: ${win.id}, Drawing: ${arch.id}]`,
                entityB: `Column [ID: ${col.id}, Drawing: ${struct.id}]`,
                recommendation: "Relocate the window opening. Structural columns cannot pierce window glazes.",
              });
            }
          }
        }
      }
    }

    return conflicts;
  }
}
