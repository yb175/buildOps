import { GeminiProvider, GEMINI_FLASH_MODEL } from "../providers/gemini.provider";
import { CLASSIFY_DOCUMENT_PROMPT, buildClassifyPrompt } from "../prompts/classify-document.prompt";
import { DocumentClassification } from "../types/classification.types";
import { logger } from "../utils/logger";

export class ClassificationService {
  private geminiProvider: GeminiProvider;

  constructor(geminiProvider = new GeminiProvider(GEMINI_FLASH_MODEL)) {
    this.geminiProvider = geminiProvider;
  }

  /**
   * Classifies the document type based on its raw OCR text.
   */
  async classify(input: string | Buffer): Promise<DocumentClassification> {
    logger.log("[ClassificationService] Classifying Document...");

    const responseSchema = {
      type: "object",
      properties: {
        isConstructionDrawing: { type: "boolean" },
        confidence: { type: "number" },
        documentType: {
          type: "string",
          enum: [
            "ARCHITECTURAL_DRAWING",
            "STRUCTURAL_DRAWING",
            "INTERIOR_DRAWING",
            "MEP_DRAWING",
            "RESUME",
            "INVOICE",
            "BANK_STATEMENT",
            "REPORT",
            "UNKNOWN"
          ]
        },
        reason: { type: "string" }
      },
      required: ["isConstructionDrawing", "confidence", "documentType", "reason"]
    };

    try {
      let result: DocumentClassification;
      if (Buffer.isBuffer(input)) {
        result = await this.geminiProvider.generateJson<DocumentClassification>(
          CLASSIFY_DOCUMENT_PROMPT,
          responseSchema,
          input
        );
      } else {
        result = await this.geminiProvider.generateJson<DocumentClassification>(
          buildClassifyPrompt(input),
          responseSchema
        );
      }

      logger.log(
        `[ClassificationService] Classification completed: type=${result.documentType}, confidence=${result.confidence}`
      );
      return result;
    } catch (error) {
      logger.error("[ClassificationService] Classification failed", error);
      throw error;
    }
  }
}
