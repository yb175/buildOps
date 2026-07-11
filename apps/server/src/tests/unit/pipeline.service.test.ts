import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PipelineService } from "../../services/pipeline.service";

describe("PipelineService unit tests", () => {
  let pipelineService: PipelineService;
  let mockOCRService: any;

  beforeEach(() => {
    mockOCRService = {
      extractText: vi.fn(),
    };
    pipelineService = new PipelineService(mockOCRService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should orchestrate analyzeDrawing by calling OCRService", async () => {
    mockOCRService.extractText.mockResolvedValue("extracted-ocr-content");

    const result = await pipelineService.analyzeDrawing("drawing-id-123");

    expect(result).toEqual({ ocrOutput: "extracted-ocr-content" });
    expect(mockOCRService.extractText).toHaveBeenCalledWith("drawing-id-123");
    expect(mockOCRService.extractText).toHaveBeenCalledTimes(1);
  });
});
