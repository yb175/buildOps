import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PipelineService } from "../../services/pipeline.service";
import * as pdfUtil from "../../utils/pdf.util";
import * as pdfRenderer from "../../utils/pdf-renderer.util";

describe("PipelineService unit tests", () => {
  let pipelineService: PipelineService;
  let mockClassificationService: any;
  let mockJsonAgentService: any;
  let mockDrawingRepository: any;

  beforeEach(() => {
    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("dummy-pdf-buffer"));
    // Simulate pdftoppm not available in test environment
    vi.spyOn(pdfRenderer, "renderPdfToImages").mockResolvedValue(null);
    mockClassificationService = {
      classify: vi.fn(),
    };
    mockJsonAgentService = {
      normalize: vi.fn(),
    };
    mockDrawingRepository = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
      updateParsedJson: vi.fn(),
    };
    pipelineService = new PipelineService(
      mockClassificationService,
      mockJsonAgentService,
      mockDrawingRepository
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return cached parsedJson if present without executing pipeline", async () => {
    const cachedDrawing = {
      id: "drawing-1",
      ocrOutput: "cached-ocr",
      fileUrl: "http://example.com/drawing.pdf",
      fileName: "drawing.pdf",
      parsedJson: { schemaVersion: "1.0", metadata: {} },
    };
    mockDrawingRepository.findById.mockResolvedValue(cachedDrawing);

    const result = await pipelineService.analyzeDrawing("drawing-1");

    expect(result).toEqual({
      parsedJson: cachedDrawing.parsedJson,
    });
    expect(mockDrawingRepository.findById).toHaveBeenCalledWith("drawing-1");
    expect(mockClassificationService.classify).not.toHaveBeenCalled();
  });

  it("should run full pipeline if parsedJson is missing", async () => {
    const drawing = {
      id: "drawing-1",
      ocrOutput: null,
      fileUrl: "http://example.com/drawing.pdf",
      fileName: "drawing.pdf",
      parsedJson: null,
    };
    mockDrawingRepository.findById.mockResolvedValue(drawing);
    mockClassificationService.classify.mockResolvedValue({
      isConstructionDrawing: true,
      confidence: 0.99,
      documentType: "ARCHITECTURAL_DRAWING",
    });
    const mockParsedJson = { schemaVersion: "1.0", metadata: {} };
    mockJsonAgentService.normalize.mockResolvedValue(mockParsedJson);

    const result = await pipelineService.analyzeDrawing("drawing-1");

    expect(result).toEqual({
      parsedJson: mockParsedJson,
    });
    expect(mockDrawingRepository.findById).toHaveBeenCalledWith("drawing-1");
    expect(mockClassificationService.classify).toHaveBeenCalledWith(expect.any(Buffer));
    expect(mockJsonAgentService.normalize).toHaveBeenCalledWith(expect.any(Buffer), "ARCHITECTURAL_DRAWING", "application/pdf");
    expect(mockDrawingRepository.updateParsedJson).toHaveBeenCalledWith(
      "drawing-1",
      mockParsedJson,
      "ARCHITECTURAL_DRAWING",
      0.99,
      "PARSED"
    );
  });
});
