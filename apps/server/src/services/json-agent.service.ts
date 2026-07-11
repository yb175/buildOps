import { ExtractionService } from "./extraction.service";
import { validateParsedDrawing } from "../schemas/parsed-drawing.schema";
import { ParsedDrawing } from "../types/parsed-drawing.types";
import { logger } from "../utils/logger";

export class JSONAgentService {
  private extractionService: ExtractionService;

  constructor(extractionService = new ExtractionService()) {
    this.extractionService = extractionService;
  }

  /**
   * Normalizes drawing content into a structured ParsedDrawing by running
   * 3 specialized extraction agents sequentially (RoomAgent, OpeningAgent, and DetailsAgent).
   *
   * @param input       Single PDF buffer, or array of PNG page buffers (300 DPI)
   * @param documentType  The classified document type (e.g. ARCHITECTURAL_DRAWING)
   * @param mimeType      "application/pdf" (default) or "image/png" for rendered pages
   */
  async normalize(
    input: Buffer | Buffer[],
    documentType: string,
    mimeType: string = "application/pdf"
  ): Promise<ParsedDrawing> {
    logger.log("[JSONAgentService] Generating ParsedDrawing...");
    try {
      const data = await this.extractionService.extract(input, documentType, mimeType);

      logger.log("[JSONAgentService] Validating structured output...");
      const validatedData = validateParsedDrawing(data);
      logger.log("[JSONAgentService] Schema Validation Passed");
      return validatedData;
    } catch (error) {
      logger.error("[JSONAgentService] Normalization / Validation failed", error);
      throw error;
    }
  }
}
