import { OCRService } from "./ocr.service";

export class PipelineService {
  private ocrService: OCRService;

  constructor(ocrService = new OCRService()) {
    this.ocrService = ocrService;
  }

  /**
   * Orchestrates the overall drawing analysis stages.
   * Currently triggers Stage 1 (OCR Extraction).
   */
  async analyzeDrawing(drawingId: string): Promise<{ ocrOutput: string }> {
    const ocrOutput = await this.ocrService.extractText(drawingId);
    return { ocrOutput };
  }
}
