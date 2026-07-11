import { ClassificationService } from "./classification.service";
import { JSONAgentService } from "./json-agent.service";
import { DrawingRepository } from "../repositories/drawing.repository";
import { UnsupportedDocumentError } from "../errors/unsupported-document.error";
import { NotFoundError } from "../errors/not-found.error";
import { downloadPDF } from "../utils/pdf.util";
import { renderPdfToImages } from "../utils/pdf-renderer.util";
import { logger } from "../utils/logger";

export class PipelineService {
  private classificationService: ClassificationService;
  private jsonAgentService: JSONAgentService;
  private drawingRepository: DrawingRepository;

  constructor(
    classificationService = new ClassificationService(),
    jsonAgentService = new JSONAgentService(),
    drawingRepository = new DrawingRepository()
  ) {
    this.classificationService = classificationService;
    this.jsonAgentService = jsonAgentService;
    this.drawingRepository = drawingRepository;
  }

  /**
   * Orchestrates the overall drawing analysis pipeline.
   */
  async analyzeDrawing(drawingId: string): Promise<{ parsedJson: any }> {
    logger.log(`[PipelineService] Starting analysis pipeline for drawingId: ${drawingId}`);

    // 1. Check Parsed JSON Cache
    const drawing = await this.drawingRepository.findById(drawingId);
    if (!drawing) {
      logger.error(`[PipelineService] Drawing not found: ${drawingId}`);
      throw new NotFoundError("Drawing not found");
    }

    if (drawing.parsedJson !== null) {
      logger.log(`[PipelineService] Parsed JSON Cache Hit for drawing: ${drawingId}`);
      logger.log(`[PipelineService] Analysis pipeline completed successfully for drawingId: ${drawingId}`);
      return { parsedJson: drawing.parsedJson };
    }
    logger.log(`[PipelineService] Parsed JSON Cache Miss for drawing: ${drawingId}`);

    if (!drawing.fileUrl) {
      logger.error(`[PipelineService] Drawing has no file URL: ${drawingId}`);
      throw new Error("Drawing has no file URL");
    }

    try {
      // 2. Download drawing PDF
      logger.log(`[PipelineService] Downloading PDF from Cloudinary URL: ${drawing.fileUrl}`);
      const pdfBuffer = await downloadPDF(drawing.fileUrl);
      logger.log(`[PipelineService] PDF Downloaded successfully (${pdfBuffer.length} bytes)`);

      // 3. Document Classification Stage
      const classification = await this.classificationService.classify(pdfBuffer);
      if (!classification.isConstructionDrawing) {
        logger.warn(
          `[PipelineService] Unsupported document type for ${drawingId}: type=${classification.documentType}, confidence=${classification.confidence}.`
        );
        await this.drawingRepository.updateStatus(drawingId, "FAILED");
        throw new UnsupportedDocumentError(
          classification.documentType,
          classification.confidence,
          classification.reason
        );
      }
      logger.log(`[PipelineService] Document Supported: ${classification.documentType}`);

      // 4. Update status to PARSING
      await this.drawingRepository.updateStatus(drawingId, "PARSING");

      // 5. Render PDF → PNG pages at 300 DPI for higher quality extraction
      //    Falls back to raw PDF buffer if pdftoppm is not available.
      let extractionInput: Buffer | Buffer[] = pdfBuffer;
      let mimeType = "application/pdf";
      const pngPages = await renderPdfToImages(pdfBuffer, 300);
      if (pngPages && pngPages.length > 0) {
        extractionInput = pngPages;
        mimeType = "image/png";
        logger.log(`[PipelineService] Using ${pngPages.length} PNG page(s) at 300 DPI for extraction`);
      } else {
        logger.log("[PipelineService] PDF rendering unavailable — using raw PDF buffer for extraction");
      }

      // 6. Multi-agent Normalization & Validation Stage
      const parsedDrawing = await this.jsonAgentService.normalize(extractionInput, classification.documentType, mimeType);

      // 6. Persist Parsed JSON and update status to PARSED
      logger.log(`[PipelineService] Persist Parsed JSON for drawingId: ${drawingId}`);
      await this.drawingRepository.updateParsedJson(
        drawingId,
        parsedDrawing,
        classification.documentType,
        classification.confidence,
        "PARSED"
      );

      logger.log(`[PipelineService] Analysis pipeline completed successfully for drawingId: ${drawingId}`);
      return { parsedJson: parsedDrawing };
    } catch (error) {
      logger.error(
        `[PipelineService] Normalization pipeline failed for drawing: ${drawingId}. Updating status to FAILED.`,
        error
      );
      await this.drawingRepository.updateStatus(drawingId, "FAILED");
      throw error;
    }
  }
}
