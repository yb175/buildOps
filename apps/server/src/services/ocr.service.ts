import { DrawingRepository } from "../repositories/drawing.repository";
import { MistralProvider } from "../providers/mistral.provider";
import { downloadPDF } from "../utils/pdf.util";
import { logger } from "../utils/logger";

// OCRService manages stage 1 OCR text extraction and caching.
export class OCRService {
  private drawingRepository: DrawingRepository;
  private mistralProvider: MistralProvider;

  constructor(
    drawingRepository = new DrawingRepository(),
    mistralProvider = new MistralProvider()
  ) {
    this.drawingRepository = drawingRepository;
    this.mistralProvider = mistralProvider;
  }

  /**
   * Orchestrates the OCR text extraction stage.
   */
  async extractText(drawingId: string): Promise<string> {
    logger.log(`[OCRService] Analysis Started for drawingId: ${drawingId}`);

    // 1. Retrieve drawing from database
    const drawing = await this.drawingRepository.findById(drawingId);
    if (!drawing) {
      logger.error(`[OCRService] Drawing not found: ${drawingId}`);
      throw new Error("Drawing not found");
    }
    logger.log(`[OCRService] Drawing Retrieved: ${drawing.fileName}`);

    // 2. Check OCR Cache
    if (drawing.ocrOutput) {
      logger.log(`[OCRService] OCR Cache Hit for drawing: ${drawingId}`);
      logger.log(`[OCRService] Analysis Completed for drawingId: ${drawingId}`);
      return drawing.ocrOutput;
    }
    logger.log(`[OCRService] OCR Cache Miss for drawing: ${drawingId}`);

    if (!drawing.fileUrl) {
      logger.error(`[OCRService] Drawing has no file URL: ${drawingId}`);
      throw new Error("Drawing has no file URL");
    }

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

    // 5. Persist OCR Output
    logger.log(`[OCRService] Persisting OCR output to drawing: ${drawingId}`);
    try {
      await this.drawingRepository.updateOcrOutput(drawingId, fullText);
    } catch (error) {
      logger.error(`[OCRService] Database persistence failure for drawing: ${drawingId}`, error);
      throw new Error(`Database persistence failure: ${error instanceof Error ? error.message : String(error)}`);
    }

    logger.log(`[OCRService] Analysis Completed for drawingId: ${drawingId}`);
    return fullText;
  }
}
