import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class ElectricalRule implements ConflictRule {
  name = "Electrical Geometry Rule";
  category = "GEOMETRY" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const fixtures = drawing.fixtures || [];
    const doors = drawing.openings?.doors || [];

    // Filter electrical panels/transformers/outlets
    const electricalFixtures = fixtures.filter((f: any) => {
      const name = String(f.name || "").toLowerCase();
      const type = String(f.type || "").toLowerCase();
      return (
        name.includes("panel") ||
        name.includes("switchboard") ||
        name.includes("transformer") ||
        name.includes("electrical") ||
        type.includes("electrical")
      );
    });

    for (const panel of electricalFixtures) {
      const panelBBox = parseBBox(panel.bbox || panel.geometry);
      if (!panelBBox) continue;

      // Check if electrical panel is blocked by a door swing
      for (const door of doors) {
        const doorBBox = parseBBox(door.bbox || door.geometry);
        if (doorBBox && intersects(panelBBox, doorBBox)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Electrical Panel Blocked by Door Swing",
            description: `Electrical component "${panel.name}" is located within the swing path of Door "${door.id}".`,
            entityA: `Electrical Panel [Name: ${panel.name}]`,
            entityB: `Door [ID: ${door.id}]`,
            recommendation: "Relocate the electrical panel or adjust the door swing direction to ensure dedicated working space clearance (typically 36 inches deep) is maintained at all times.",
          });
        }
      }
    }

    return conflicts;
  }
}
