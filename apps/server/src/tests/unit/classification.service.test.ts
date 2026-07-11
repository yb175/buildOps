import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClassificationService } from "../../services/classification.service";

describe("ClassificationService unit tests", () => {
  let classificationService: ClassificationService;
  let mockGeminiProvider: any;

  beforeEach(() => {
    mockGeminiProvider = {
      generateJson: vi.fn(),
    };
    classificationService = new ClassificationService(mockGeminiProvider);
  });

  it("should classify a document successfully and return DocumentClassification", async () => {
    const mockResult = {
      isConstructionDrawing: true,
      confidence: 0.98,
      documentType: "ARCHITECTURAL_DRAWING",
      reason: "This is an architectural layout",
    };
    mockGeminiProvider.generateJson.mockResolvedValue(mockResult);

    const result = await classificationService.classify("Raw OCR text sample");

    expect(result).toEqual(mockResult);
    expect(mockGeminiProvider.generateJson).toHaveBeenCalledTimes(1);
    expect(mockGeminiProvider.generateJson).toHaveBeenCalledWith(
      expect.stringContaining("Raw OCR text sample"),
      expect.any(Object)
    );
  });

  it("should classify a document successfully using a Buffer input", async () => {
    const mockResult = {
      isConstructionDrawing: true,
      confidence: 0.98,
      documentType: "ARCHITECTURAL_DRAWING",
      reason: "This is an architectural layout",
    };
    mockGeminiProvider.generateJson.mockResolvedValue(mockResult);

    const buffer = Buffer.from("pdf-data");
    const result = await classificationService.classify(buffer);

    expect(result).toEqual(mockResult);
    expect(mockGeminiProvider.generateJson).toHaveBeenCalledTimes(1);
    expect(mockGeminiProvider.generateJson).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      buffer
    );
  });
});
