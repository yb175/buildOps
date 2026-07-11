import { describe, it, expect } from "vitest";
import { validateParsedDrawing } from "../../schemas/parsed-drawing.schema";

describe("validateParsedDrawing schema unit tests", () => {
  it("should successfully validate a correct ParsedDrawing JSON structure", () => {
    const validData = {
      schemaVersion: "1.0",
      metadata: {
        drawingNumber: "A-101",
        title: "Floor Plan",
      },
      rooms: [
        {
          name: "Kitchen",
          areaSquareFeet: 120,
        },
      ],
      structural: {
        foundations: [],
        columns: [],
        beams: [],
        slabs: [],
        walls: [],
        gridLines: [
          {
            label: "A",
            direction: "HORIZONTAL",
          },
        ],
      },
      openings: {
        doors: [],
        windows: [],
      },
      fixtures: [],
      annotations: [],
      schedules: [],
      notes: ["Note 1"],
    };

    expect(() => validateParsedDrawing(validData)).not.toThrow();
    const result = validateParsedDrawing(validData);
    expect(result.schemaVersion).toBe("1.0");
    expect(result.metadata.title).toBe("Floor Plan");
  });

  it("should fail validation if schemaVersion is incorrect", () => {
    const invalidData = {
      schemaVersion: "2.0",
      metadata: {},
      rooms: [],
      structural: { foundations: [], columns: [], beams: [], slabs: [], walls: [], gridLines: [] },
      openings: { doors: [], windows: [] },
      fixtures: [],
      annotations: [],
      schedules: [],
      notes: [],
    };
    expect(() => validateParsedDrawing(invalidData)).toThrow("Invalid schemaVersion: must be '1.0'");
  });

  it("should fail validation if structural fields are missing", () => {
    const invalidData = {
      schemaVersion: "1.0",
      metadata: {},
      rooms: [],
      structural: { foundations: [] },
      openings: { doors: [], windows: [] },
      fixtures: [],
      annotations: [],
      schedules: [],
      notes: [],
    };
    expect(() => validateParsedDrawing(invalidData)).toThrow("structural.columns must be an array");
  });

  it("should fail validation if notes contain non-strings", () => {
    const invalidData = {
      schemaVersion: "1.0",
      metadata: {},
      rooms: [],
      structural: { foundations: [], columns: [], beams: [], slabs: [], walls: [], gridLines: [] },
      openings: { doors: [], windows: [] },
      fixtures: [],
      annotations: [],
      schedules: [],
      notes: [123],
    };
    expect(() => validateParsedDrawing(invalidData)).toThrow("notes elements must be strings");
  });

  it("should fail validation if structural.gridLines is missing", () => {
    const invalidData = {
      schemaVersion: "1.0",
      metadata: {},
      rooms: [],
      structural: { foundations: [], columns: [], beams: [], slabs: [], walls: [] },
      openings: { doors: [], windows: [] },
      fixtures: [],
      annotations: [],
      schedules: [],
      notes: [],
    };
    expect(() => validateParsedDrawing(invalidData)).toThrow("structural.gridLines must be an array");
  });

  it("should fail validation if structural.gridLines elements are not objects", () => {
    const invalidData = {
      schemaVersion: "1.0",
      metadata: {},
      rooms: [],
      structural: { foundations: [], columns: [], beams: [], slabs: [], walls: [], gridLines: ["invalid"] as any },
      openings: { doors: [], windows: [] },
      fixtures: [],
      annotations: [],
      schedules: [],
      notes: [],
    };
    expect(() => validateParsedDrawing(invalidData)).toThrow("structural.gridLines elements must be objects");
  });

  it("should fail validation if structural.gridLines element is missing label", () => {
    const invalidData = {
      schemaVersion: "1.0",
      metadata: {},
      rooms: [],
      structural: { foundations: [], columns: [], beams: [], slabs: [], walls: [], gridLines: [{ direction: "HORIZONTAL" }] as any },
      openings: { doors: [], windows: [] },
      fixtures: [],
      annotations: [],
      schedules: [],
      notes: [],
    };
    expect(() => validateParsedDrawing(invalidData)).toThrow("structural.gridLines[].label must be a string");
  });

  it("should fail validation if structural.gridLines element is missing direction", () => {
    const invalidData = {
      schemaVersion: "1.0",
      metadata: {},
      rooms: [],
      structural: { foundations: [], columns: [], beams: [], slabs: [], walls: [], gridLines: [{ label: "A" }] as any },
      openings: { doors: [], windows: [] },
      fixtures: [],
      annotations: [],
      schedules: [],
      notes: [],
    };
    expect(() => validateParsedDrawing(invalidData)).toThrow("structural.gridLines[].direction must be a string");
  });
});
