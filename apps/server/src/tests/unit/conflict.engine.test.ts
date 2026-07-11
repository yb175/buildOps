import { describe, it, expect } from "vitest";
import { ConflictEngine } from "../../conflict/engine/conflict.engine";

describe("ConflictEngine unit tests", () => {
  it("should run registered rules, de-duplicate identical conflicts, and sort them by severity", async () => {
    // Arrange
    const mockDrawing: any = {
      schemaVersion: "1.0",
      metadata: {
        title: "Test Plan",
        drawingNumber: "A-101",
        discipline: "ARCHITECTURAL",
      },
      rooms: [
        { id: "R-01", name: "Bedroom", number: "101", dimensions: "12'-0\" x 10'-0\"" },
        { id: "R-02", name: "Bedroom", number: "101", dimensions: "12'-0\" x 10'-0\"" }, // Duplicate name & number
        { id: "R-03", name: "Office" }, // Missing dimensions
      ],
      structural: {
        foundations: [],
        columns: [],
        beams: [],
        slabs: [],
        walls: [],
        gridLines: [],
      },
      openings: {
        doors: [],
        windows: [],
      },
      fixtures: [],
      annotations: [],
      schedules: [],
      notes: [],
    };

    const engine = new ConflictEngine();

    // Act
    const conflicts = await engine.analyze({
      drawing: mockDrawing,
      drawingId: "test-drawing-uuid",
      allDrawings: [],
    });

    // Assert
    expect(conflicts.length).toBeGreaterThan(0);

    // Verify duplicate room name was caught
    const dupNames = conflicts.filter((c) => c.title === "Duplicate Room Name Detected");
    expect(dupNames.length).toBe(1); // De-duplicated down to 1

    // Verify missing dimensions room was caught
    const missingDims = conflicts.filter((c) => c.title === "Missing Room Dimensions and Area");
    expect(missingDims.length).toBe(1);

    // Verify sorting (CRITICAL > HIGH > MEDIUM > LOW)
    let lastPriority = -1;
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    for (const conflict of conflicts) {
      const currentPriority = severityOrder[conflict.severity];
      expect(currentPriority).toBeGreaterThanOrEqual(lastPriority);
      lastPriority = currentPriority;
    }
  });
});
