import { Request, Response, NextFunction } from "express";
import { PipelineService } from "../services/pipeline.service";
import { NotFoundError } from "../errors/not-found.error";
import { UnsupportedDocumentError } from "../errors/unsupported-document.error";
import { logger } from "../utils/logger";

export class AnalysisController {
  private pipelineService: PipelineService;

  constructor(pipelineService = new PipelineService()) {
    this.pipelineService = pipelineService;
  }

  /**
   * Triggers the analysis pipeline on the uploaded drawing.
   */
  analyze = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Missing drawing ID" });
      }

      const result = await this.pipelineService.analyzeDrawing(id);
      return res.status(200).json({
        drawingId: id,
        parsedJson: result.parsedJson,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof UnsupportedDocumentError) {
        return res.status(422).json({
          error: error.message,
          documentType: error.documentType,
          confidence: error.confidence,
          reason: error.reason,
        });
      }
      if (error instanceof Error) {
        logger.error(`[AnalysisController] Error during analysis for drawing: ${req.params.id}`, error);
        return res.status(500).json({ error: "Unexpected server error during analysis." });
      }
      next(error);
    }
  };
}
