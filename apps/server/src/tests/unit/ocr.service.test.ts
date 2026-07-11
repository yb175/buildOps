import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OCRService } from "../../services/ocr.service";
import * as pdfUtil from "../../utils/pdf.util";

describe("OCRService unit tests", () => {
  let ocrService: OCRService;
  let mockDrawingRepository: any;
  let mockMistralProvider: any;

  beforeEach(() => {
    mockDrawingRepository = {
      findById: vi.fn(),
      updateOcrOutput: vi.fn(),
    };
    mockMistralProvider = {
      uploadFile: vi.fn(),
      performOCR: vi.fn(),
    };
    ocrService = new OCRService(mockDrawingRepository, mockMistralProvider);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return cached OCR output if it exists", async () => {
    const mockDrawing = {
      id: "drawing-1",
      ocrOutput: "cached-ocr-content",
      fileName: "drawing.pdf",
    };
    mockDrawingRepository.findById.mockResolvedValue(mockDrawing);

    const result = await ocrService.extractText("drawing-1");

    expect(result).toBe("cached-ocr-content");
    expect(mockDrawingRepository.findById).toHaveBeenCalledWith("drawing-1");
    expect(mockMistralProvider.uploadFile).not.toHaveBeenCalled();
    expect(mockMistralProvider.performOCR).not.toHaveBeenCalled();
  });

  it("should throw error if drawing is not found", async () => {
    mockDrawingRepository.findById.mockResolvedValue(null);

    await expect(ocrService.extractText("non-existent")).rejects.toThrow("Drawing not found");
  });

  it("should run complete OCR flow on cache miss and save output", async () => {
    const mockDrawing = {
      id: "drawing-1",
      ocrOutput: null,
      fileName: "drawing.pdf",
      fileUrl: "https://cloudinary.com/pdf",
    };
    mockDrawingRepository.findById.mockResolvedValue(mockDrawing);

    // Mock PDF download
    const downloadSpy = vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 mock content"));

    // Mock Mistral provider
    mockMistralProvider.uploadFile.mockResolvedValue("mistral-file-id");
    mockMistralProvider.performOCR.mockResolvedValue({
      pages: [{ markdown: "Page 1 Extracted text" }, { markdown: "Page 2 Extracted text" }],
    });

    const result = await ocrService.extractText("drawing-1");

    expect(result).toBe("Page 1 Extracted text\n\nPage 2 Extracted text");
    expect(downloadSpy).toHaveBeenCalledWith("https://cloudinary.com/pdf");
    expect(mockMistralProvider.uploadFile).toHaveBeenCalledTimes(1);
    expect(mockMistralProvider.performOCR).toHaveBeenCalledWith("mistral-file-id");
    expect(mockDrawingRepository.updateOcrOutput).toHaveBeenCalledWith(
      "drawing-1",
      "Page 1 Extracted text\n\nPage 2 Extracted text"
    );
  });

  it("should propagate Mistral provider errors", async () => {
    const mockDrawing = {
      id: "drawing-1",
      ocrOutput: null,
      fileName: "drawing.pdf",
      fileUrl: "https://cloudinary.com/pdf",
    };
    mockDrawingRepository.findById.mockResolvedValue(mockDrawing);

    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 mock content"));
    mockMistralProvider.uploadFile.mockRejectedValue(new Error("Upload failure"));

    await expect(ocrService.extractText("drawing-1")).rejects.toThrow("Upload failure");
  });
});
