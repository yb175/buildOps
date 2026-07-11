import { Request, Response, NextFunction } from "express";
import { PipelineService } from "../services/pipeline.service";

export class AnalysisController {
  private pipelineService: PipelineService;

  constructor(pipelineService = new PipelineService()) {
    this.pipelineService = pipelineService;
  }

  /**
   * Triggers E2E OCR processing on the uploaded drawing.
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
        ocrOutput: result.ocrOutput,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Drawing not found") {
          return res.status(404).json({ error: "Drawing not found" });
        }
        return res.status(500).json({ error: error.message });
      }
      next(error);
    }
  };
}
