import { ConflictRule, Conflict } from "../../models/conflict.types";
import { randomUUID } from "crypto";

export class FixtureRule implements ConflictRule {
  name = "Fixture Validation Rule";
  category = "SEMANTIC" as const;

  execute(context: any): Conflict[] {
    const conflicts: Conflict[] = [];
    const drawing = context.drawing;
    const rooms = drawing.rooms || [];
    const fixtures = drawing.fixtures || [];

    // Heuristic: If there are rooms, but fixtures array is completely empty, it might be an extraction omission
    if (rooms.length > 0 && fixtures.length === 0) {
      conflicts.push({
        id: randomUUID(),
        category: this.category,
        severity: "MEDIUM",
        title: "Empty Fixtures List",
        description: "The drawing contains defined rooms but has no fixtures or fittings listed. Common items like toilets, sinks, and appliances may have been omitted.",
        entityA: "Fixtures Array",
        recommendation: "Ensure that mechanical, plumbing, and furniture fixtures have been fully extracted and populated.",
      });
      return conflicts;
    }

    // Check specific rooms (e.g. Bathrooms, Restrooms, Washrooms)
    for (const room of rooms) {
      if (!room.name) continue;
      const roomNameLower = String(room.name).toLowerCase();
      if (
        roomNameLower.includes("bath") ||
        roomNameLower.includes("toilet") ||
        roomNameLower.includes("restroom") ||
        roomNameLower.includes("powder") ||
        roomNameLower.includes("wc") ||
        roomNameLower.includes("ensuite") ||
        roomNameLower.includes("washroom")
      ) {
        // Find if any plumbing fixture is associated with this room
        const roomFixtures = fixtures.filter((f: any) => {
          const locLower = f.location ? String(f.location).toLowerCase() : "";
          const nameLower = f.name ? String(f.name).toLowerCase() : "";
          // Check if fixture location mentions room name/number OR is located in this room
          return (
            locLower.includes(roomNameLower) ||
            (room.number && locLower.includes(String(room.number).toLowerCase())) ||
            nameLower.includes(roomNameLower)
          );
        });

        const hasToilet = roomFixtures.some((f: any) => {
          const name = String(f.name).toLowerCase();
          return name.includes("toilet") || name.includes("wc") || name.includes("closet") || name.includes("water closet");
        });

        const hasSink = roomFixtures.some((f: any) => {
          const name = String(f.name).toLowerCase();
          return name.includes("sink") || name.includes("basin") || name.includes("lavatory") || name.includes("vanity");
        });

        if (roomFixtures.length === 0) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "HIGH",
            title: "Missing Bathroom Fixtures",
            description: `Room "${room.name}" is designated as a restroom/bathroom but has no fixtures assigned to it.`,
            entityA: `Room [ID: ${room.id || "N/A"}, Name: ${room.name}]`,
            recommendation: "Verify and add plumbing fixtures (WC, sink, shower/bathtub) for this bathroom area.",
          });
        } else if (!hasToilet) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "MEDIUM",
            title: "Missing Toilet (WC) in Bathroom",
            description: `Room "${room.name}" has fixtures but is missing a toilet/water closet (WC).`,
            entityA: `Room [ID: ${room.id || "N/A"}, Name: ${room.name}]`,
            recommendation: "Ensure a water closet fixture is designated in this restroom layout.",
          });
        } else if (!hasSink) {
          conflicts.push({
            id: randomUUID(),
            category: this.category,
            severity: "LOW",
            title: "Missing Sink in Bathroom",
            description: `Room "${room.name}" has fixtures but is missing a wash basin/sink.`,
            entityA: `Room [ID: ${room.id || "N/A"}, Name: ${room.name}]`,
            recommendation: "Ensure a hand wash basin fixture is designated in this restroom layout.",
          });
        }
      }
    }

    return conflicts;
  }
}
