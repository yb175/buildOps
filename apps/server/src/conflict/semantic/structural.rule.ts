import { ConflictRule, Conflict } from "../../models/conflict.types";
import { randomUUID } from "crypto";

export class StructuralRule implements ConflictRule {
  name = "Structural Verification Rule";
  category = "SEMANTIC" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;

    // Check for completely empty drawing
    const count = (arr: any) => Array.isArray(arr) ? arr.length : 0;
    const roomCount = count(drawing.rooms);
    const doorCount = count(drawing.openings?.doors);
    const windowCount = count(drawing.openings?.windows);
    const fixtureCount = count(drawing.fixtures);
    const annotationCount = count(drawing.annotations);
    const noteCount = count(drawing.notes);
    const scheduleCount = count(drawing.schedules);

    const structural = drawing.structural || {};
    const foundationCount = count(structural.foundations);
    const columnCount = count(structural.columns);
    const beamCount = count(structural.beams);
    const slabCount = count(structural.slabs);
    const wallCount = count(structural.walls);
    const gridLineCount = count(structural.gridLines);

    const totalStructuralCount =
      foundationCount + columnCount + beamCount + slabCount + wallCount + gridLineCount;

    const totalEntities =
      roomCount +
      doorCount +
      windowCount +
      fixtureCount +
      annotationCount +
      noteCount +
      scheduleCount +
      totalStructuralCount;

    if (totalEntities === 0) {
      conflicts.push({
        id: randomUUID(),
        category: this.category,
        severity: "CRITICAL",
        title: "Empty Drawing JSON",
        description: "The drawing JSON contains no extracted elements (rooms, openings, structural components, or annotations). It is completely blank.",
        entityA: "Drawing Root",
        recommendation: "Re-run the OCR/LLM normalization extraction, check input PDF file resolution, or verify drawing source content is valid.",
      });
      return conflicts;
    }

    // Check for missing structural elements entirely
    if (totalStructuralCount === 0) {
      const currentInfo = context.allDrawings?.find((d: any) => d.id === context.drawingId);
      const discipline = currentInfo?.discipline;
      if (discipline === "STRUCTURAL" || discipline === "ARCHITECTURAL" || !discipline) {
        conflicts.push({
          id: randomUUID(),
          category: this.category,
          severity: "MEDIUM",
          title: "Missing Structural Elements",
          description: "No structural components (columns, beams, slabs, foundations, walls, or grid lines) were found in this drawing. This is normal for architectural schematics but critical for structural details.",
          entityA: "Structural Block",
          recommendation: "Ensure that if this is a structural or concrete reinforcement drawing, columns, beams, slabs, and gridlines are fully modeled.",
        });
      }
    }

    // Check for missing grid lines when columns exist
    if (columnCount > 0 && gridLineCount === 0) {
      conflicts.push({
        id: randomUUID(),
        category: this.category,
        severity: "HIGH",
        title: "Columns without Grid Lines",
        description: "Columns are defined in the drawing, but no structural grid lines (A, B, 1, 2...) are present to reference them.",
        entityA: "Structural Columns & GridLines",
        recommendation: "Verify if grid lines exist on the sheet and make sure they are extracted to provide coordinate references for columns.",
      });
    }

    return conflicts;
  }
}
