import { DrawingRepository } from "../repositories/drawing.repository";
import { MistralProvider } from "../providers/mistral.provider";
import { downloadPDF } from "../utils/pdf.util";
import { logger } from "../utils/logger";
import { NotFoundError } from "../errors/not-found.error";
import { DrawingStatus } from "@prisma/client";

// OCRService manages stage 1 OCR text extraction and caching.
export class OCRService {
  private drawingRepository: DrawingRepository;
  private mistralProvider: MistralProvider;
  private static inFlightJobs = new Map<string, Promise<string>>();

  constructor(
    drawingRepository = new DrawingRepository(),
    mistralProvider = new MistralProvider()
  ) {
    this.drawingRepository = drawingRepository;
    this.mistralProvider = mistralProvider;
  }

  /**
   * Orchestrates the OCR text extraction stage.
   * Merges concurrent in-flight requests for the same drawing ID.
   */
  async extractText(drawingId: string): Promise<string> {
    const activeJob = OCRService.inFlightJobs.get(drawingId);
    if (activeJob) {
      logger.log(`[OCRService] Acknowledging concurrent in-flight OCR job for drawing: ${drawingId}`);
      return activeJob;
    }

    const jobPromise = this.processOcr(drawingId);
    OCRService.inFlightJobs.set(drawingId, jobPromise);

    try {
      const result = await jobPromise;
      OCRService.inFlightJobs.delete(drawingId);
      return result;
    } catch (error) {
      OCRService.inFlightJobs.delete(drawingId);
      throw error;
    }
  }

  /**
   * Internal E2E OCR extraction logic.
   */
  private async processOcr(drawingId: string): Promise<string> {
    logger.log(`[OCRService] Analysis Started for drawingId: ${drawingId}`);

    // 1. Retrieve drawing from database
    const drawing = await this.drawingRepository.findById(drawingId);
    if (!drawing) {
      logger.error(`[OCRService] Drawing not found: ${drawingId}`);
      throw new NotFoundError("Drawing not found");
    }
    logger.log(`[OCRService] Drawing Retrieved: ${drawing.fileName}`);

    // 2. Check OCR Cache (Empty string "" is a valid cached output, only null is a cache miss)
    if (drawing.ocrOutput !== null) {
      logger.log(`[OCRService] OCR Cache Hit for drawing: ${drawingId}`);
      logger.log(`[OCRService] Analysis Completed for drawingId: ${drawingId}`);
      return drawing.ocrOutput;
    }
    logger.log(`[OCRService] OCR Cache Miss for drawing: ${drawingId}`);

    if (!drawing.fileUrl) {
      logger.error(`[OCRService] Drawing has no file URL: ${drawingId}`);
      throw new Error("Drawing has no file URL");
    }

    // Set drawing status to OCR_PROCESSING
    await this.drawingRepository.updateStatus(drawingId, DrawingStatus.OCR_PROCESSING);

    try {
      // 3. Download PDF
      logger.log(`[OCRService] Downloading PDF from Cloudinary URL: ${drawing.fileUrl}`);
      const fileBuffer = await downloadPDF(drawing.fileUrl);
      logger.log(`[OCRService] PDF Downloaded successfully (${fileBuffer.length} bytes)`);

      // 4. Invoke Mistral OCR
      logger.log("[OCRService] Calling Mistral OCR...");
      const fileId = await this.mistralProvider.uploadFile(fileBuffer, drawing.fileName || "drawing.pdf");
      const ocrResult = await this.mistralProvider.performOCR(fileId);
      logger.log("[OCRService] OCR Completed");

      const fullText = ocrResult.pages.map((p) => p.markdown).join("\n\n");

      // 5. Persist OCR Output and update status to OCR_COMPLETED
      logger.log(`[OCRService] Persisting OCR output to drawing: ${drawingId}`);
      await this.drawingRepository.updateOcrOutput(drawingId, fullText, DrawingStatus.OCR_COMPLETED);

      logger.log(`[OCRService] Analysis Completed for drawingId: ${drawingId}`);
      return fullText;
    } catch (error) {
      logger.error(`[OCRService] OCR processing failed for drawing: ${drawingId}. Updating status to OCR_FAILED.`, error);
      try {
        await this.drawingRepository.updateStatus(drawingId, DrawingStatus.OCR_FAILED);
      } catch (statusError) {
        logger.error(`[OCRService] Failed to update drawing status to OCR_FAILED for: ${drawingId}`, statusError);
      }
      throw error;
    }
  }
}
