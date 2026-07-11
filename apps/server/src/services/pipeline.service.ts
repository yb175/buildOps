import { OCRService } from "./ocr.service";
import { logger } from "../utils/logger";

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
    logger.log(`[PipelineService] Starting analysis pipeline for drawingId: ${drawingId}`);
    try {
      const ocrOutput = await this.ocrService.extractText(drawingId);
      logger.log(`[PipelineService] Analysis pipeline completed successfully for drawingId: ${drawingId}`);
      return { ocrOutput };
    } catch (error) {
      logger.error(`[PipelineService] Analysis pipeline failed for drawingId: ${drawingId}`, error);
      throw error;
    }
  }
}
