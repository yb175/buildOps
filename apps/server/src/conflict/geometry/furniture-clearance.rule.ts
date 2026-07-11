import { ConflictRule, Conflict } from "../../models/conflict.types";
import { parseBBox, intersects } from "../geometry/bbox.util";
import { randomUUID } from "crypto";

export class FurnitureClearanceRule implements ConflictRule {
  name = "Furniture Clearance Geometry Rule";
  category = "GEOMETRY" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const fixtures = drawing.fixtures || [];
    const doors = drawing.openings?.doors || [];
    const windows = drawing.openings?.windows || [];

    // Filter furniture/appliances/circulation fixtures
    const furniture = fixtures.filter(
      (f: any) => f.type === "FURNITURE" || f.type === "APPLIANCE" || f.type === "CIRCULATION" || !f.type
    );

    for (const item of furniture) {
      const itemBBox = parseBBox(item.bbox || item.geometry);

      // Check doors
      for (const door of doors) {
        const doorBBox = parseBBox(door.bbox || door.geometry);
        if (itemBBox && doorBBox && intersects(itemBBox, doorBBox)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Furniture Blocks Doorway",
            description: `Fixture "${item.name}" at location "${item.location || "N/A"}" overlaps with Door "${door.id}" doorway swing.`,
            entityA: `Fixture [ID: ${item.id || "N/A"}, Name: ${item.name}]`,
            entityB: `Door [ID: ${door.id}]`,
            recommendation: "Re-arrange layout to ensure a minimum of 36 inches clearance in front of all door openings.",
          });
        }
      }

      // Check windows
      for (const window of windows) {
        const winBBox = parseBBox(window.bbox || window.geometry);
        if (itemBBox && winBBox && intersects(itemBBox, winBBox)) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "MEDIUM",
            title: "Furniture Blocks Window",
            description: `Fixture "${item.name}" at location "${item.location || "N/A"}" overlaps with Window "${window.id}".`,
            entityA: `Fixture [ID: ${item.id || "N/A"}, Name: ${item.name}]`,
            entityB: `Window [ID: ${window.id}]`,
            recommendation: "Ensure furniture placement does not obstruct egress windows or natural daylight openings.",
          });
        }
      }
    }

    // Semantic fallback if no coordinates exist
    const hasCoordinates = fixtures.some((f: any) => f.bbox || f.geometry) || doors.some((d: any) => d.bbox || d.geometry);
    if (!hasCoordinates) {
      for (const item of furniture) {
        const locLower = item.location ? item.location.toLowerCase() : "";

        if (locLower.includes("block") || locLower.includes("obstruct")) {
          const isDoor = locLower.includes("door");
          const isWindow = locLower.includes("window");

          if (isDoor) {
            conflicts.push({
              id: randomUUID(),
              category: this.category,
              severity: "HIGH",
              title: "Furniture Blocks Doorway (Semantic)",
              description: `Fixture "${item.name}" is semantically described as blocking a door: "${item.location}".`,
              entityA: `Fixture [ID: ${item.id || "N/A"}, Name: ${item.name}]`,
              recommendation: "Adjust interior design layout to clear path of egress.",
            });
          }
          if (isWindow) {
            conflicts.push({
              id: randomUUID(),
              category: this.category,
              severity: "MEDIUM",
              title: "Furniture Blocks Window (Semantic)",
              description: `Fixture "${item.name}" is semantically described as blocking a window: "${item.location}".`,
              entityA: `Fixture [ID: ${item.id || "N/A"}, Name: ${item.name}]`,
              recommendation: "Adjust furniture layout to avoid obstructing windows.",
            });
          }
        }
      }
    }

    return conflicts;
  }
}
