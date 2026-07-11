import { describe, it, expect, vi, beforeEach } from "vitest";
import { RfiService } from "../../services/rfi.service";
import { NotFoundError } from "../../errors/not-found.error";
import { computeConflictsHash } from "../../rfi/formatter";

describe("RfiService unit tests", () => {
  let rfiService: RfiService;
  let mockDrawingRepo: any;
  let mockConflictRepo: any;
  let mockRfiRepo: any;
  let mockGeminiProvider: any;

  const mockDrawingId = "123e4567-e89b-12d3-a456-426614174000";
  const mockDrawing = {
    id: mockDrawingId,
    fileName: "plan.pdf",
    discipline: "ARCHITECTURAL",
  };

  const mockConflicts = [
    {
      id: "987f6543-e21b-12d3-a456-426614174000",
      category: "GEOMETRY",
      severity: "HIGH",
      title: "Door intersects Column",
      description: "Door D4 intersects Column C2",
      entityA: "Door D4",
      entityB: "Column C2",
      recommendation: "Shift door to clear column.",
    },
  ];

  beforeEach(() => {
    mockDrawingRepo = {
      findById: vi.fn(),
    };
    mockConflictRepo = {
      findByDrawingId: vi.fn(),
    };
    mockRfiRepo = {
      findByDrawingId: vi.fn(),
      saveRfis: vi.fn(),
    };
    mockGeminiProvider = {
      generateJson: vi.fn(),
    };

    rfiService = new RfiService(
      mockRfiRepo as any,
      mockConflictRepo as any,
      mockDrawingRepo as any,
      mockGeminiProvider as any
    );
  });

  it("should throw NotFoundError if drawing is not found", async () => {
    mockDrawingRepo.findById.mockResolvedValue(null);

    await expect(rfiService.generateAndPersistRfis(mockDrawingId)).rejects.toThrow(NotFoundError);
  });

  it("should return empty list if drawing has no conflicts", async () => {
    mockDrawingRepo.findById.mockResolvedValue(mockDrawing);
    mockConflictRepo.findByDrawingId.mockResolvedValue([]);
    mockRfiRepo.saveRfis.mockResolvedValue([]);

    const result = await rfiService.generateAndPersistRfis(mockDrawingId);

    expect(result).toEqual([]);
    expect(mockRfiRepo.saveRfis).toHaveBeenCalledWith(mockDrawingId, [], "");
  });

  it("should return cached RFIs if conflict hash is unchanged", async () => {
    mockDrawingRepo.findById.mockResolvedValue(mockDrawing);
    mockConflictRepo.findByDrawingId.mockResolvedValue(mockConflicts);

    const expectedHash = computeConflictsHash(mockConflicts as any);
    const cachedRfis = [
      {
        id: "rfi-uuid-1",
        drawingId: mockDrawingId,
        conflictId: "987f6543-e21b-12d3-a456-426614174000",
        title: "RFI for Door intersects Column",
        priority: "HIGH",
        discipline: "ARCHITECTURAL",
        description: "Door intersects column description",
        question: "Clarification question",
        recommendation: "Shift column",
        status: "GENERATED",
        conflictHash: expectedHash,
        createdAt: new Date(),
      },
    ];

    mockRfiRepo.findByDrawingId.mockResolvedValue(cachedRfis);

    const result = await rfiService.generateAndPersistRfis(mockDrawingId);

    expect(result).toEqual(cachedRfis);
    expect(mockGeminiProvider.generateJson).not.toHaveBeenCalled();
    expect(mockRfiRepo.saveRfis).not.toHaveBeenCalled();
  });

  it("should call Gemini and persist RFIs if conflict hash is changed (cache miss)", async () => {
    mockDrawingRepo.findById.mockResolvedValue(mockDrawing);
    mockConflictRepo.findByDrawingId.mockResolvedValue(mockConflicts);
    mockRfiRepo.findByDrawingId.mockResolvedValue([]); // cache empty

    const geminiRefinement = [
      {
        conflictId: "987f6543-e21b-12d3-a456-426614174000",
        description: "Gemini refined description",
        question: "Gemini refined question",
        recommendation: "Gemini refined recommendation",
      },
    ];
    mockGeminiProvider.generateJson.mockResolvedValue(geminiRefinement);
    mockRfiRepo.saveRfis.mockImplementation((_drawingId: any, rfis: any, _hash: any) => rfis);

    const result = (await rfiService.generateAndPersistRfis(mockDrawingId)) as any;

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Gemini refined description");
    expect(result[0].question).toBe("Gemini refined question");
    expect(result[0].recommendation).toBe("Gemini refined recommendation");
    expect(mockRfiRepo.saveRfis).toHaveBeenCalled();
  });

  it("should fall back to defaults if Gemini call throws an error", async () => {
    mockDrawingRepo.findById.mockResolvedValue(mockDrawing);
    mockConflictRepo.findByDrawingId.mockResolvedValue(mockConflicts);
    mockRfiRepo.findByDrawingId.mockResolvedValue([]); // cache empty

    mockGeminiProvider.generateJson.mockRejectedValue(new Error("Gemini Quota Exceeded"));
    mockRfiRepo.saveRfis.mockImplementation((_drawingId: any, rfis: any, _hash: any) => rfis);

    const result = (await rfiService.generateAndPersistRfis(mockDrawingId)) as any;

    expect(result).toHaveLength(1);
    expect(result[0].description).toContain("A conflict of HIGH severity was detected");
    expect(result[0].question).toContain("Please verify and confirm the design intent");
    expect(result[0].recommendation).toBe("Shift door to clear column."); // from conflict recommendation
    expect(mockRfiRepo.saveRfis).toHaveBeenCalled();
  });

  it("should fall back to defaults if Gemini returns invalid schema (failed validation)", async () => {
    mockDrawingRepo.findById.mockResolvedValue(mockDrawing);
    mockConflictRepo.findByDrawingId.mockResolvedValue(mockConflicts);
    mockRfiRepo.findByDrawingId.mockResolvedValue([]); // cache empty

    // Missing description and question to fail validation
    const invalidGeminiResponse = [
      {
        conflictId: "987f6543-e21b-12d3-a456-426614174000",
        description: "",
        question: "",
        recommendation: "Gemini recommendation",
      },
    ];
    mockGeminiProvider.generateJson.mockResolvedValue(invalidGeminiResponse);
    mockRfiRepo.saveRfis.mockImplementation((_drawingId: any, rfis: any, _hash: any) => rfis);

    const result = (await rfiService.generateAndPersistRfis(mockDrawingId)) as any;

    // It should fall back to deterministic default because of validation failure
    expect(result).toHaveLength(1);
    expect(result[0].description).toContain("A conflict of HIGH severity was detected");
    expect(result[0].question).toContain("Please verify and confirm the design intent");
    expect(mockRfiRepo.saveRfis).toHaveBeenCalled();
  });
});
