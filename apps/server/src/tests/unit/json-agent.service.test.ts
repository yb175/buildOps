import { describe, it, expect, vi, beforeEach } from "vitest";
import { JSONAgentService } from "../../services/json-agent.service";
import { ExtractionService } from "../../services/extraction.service";

describe("JSONAgentService unit tests", () => {
  let jsonAgentService: JSONAgentService;
  let mockExtractionService: any;

  const validParsedJson = {
    schemaVersion: "1.0",
    metadata: { drawingNumber: "A-102", title: null, project: null, revision: null, scale: null, date: null },
    rooms: [],
    structural: { foundations: [], columns: [], beams: [], slabs: [], walls: [] },
    openings: { doors: [], windows: [] },
    fixtures: [],
    annotations: [],
    schedules: [],
    notes: [],
  };

  beforeEach(() => {
    mockExtractionService = {
      extract: vi.fn(),
    };
    jsonAgentService = new JSONAgentService(mockExtractionService as unknown as ExtractionService);
  });

  it("should successfully normalize valid drawing JSON via ExtractionService", async () => {
    mockExtractionService.extract.mockResolvedValue(validParsedJson);

    const result = await jsonAgentService.normalize(Buffer.from("pdf-data"), "ARCHITECTURAL_DRAWING");

    expect(result).toEqual(validParsedJson);
    expect(mockExtractionService.extract).toHaveBeenCalledTimes(1);
    expect(mockExtractionService.extract).toHaveBeenCalledWith(
      expect.any(Buffer),
      "ARCHITECTURAL_DRAWING",
      "application/pdf"
    );
  });

  it("should throw validation error if extracted JSON violates schema", async () => {
    const invalidJson = { schemaVersion: "2.0", metadata: {}, rooms: [] };
    mockExtractionService.extract.mockResolvedValue(invalidJson);

    await expect(
      jsonAgentService.normalize(Buffer.from("pdf-data"), "ARCHITECTURAL_DRAWING")
    ).rejects.toThrow("Invalid schemaVersion: must be '1.0'");
  });
});
