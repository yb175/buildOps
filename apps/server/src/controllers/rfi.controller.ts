import { Request, Response, NextFunction } from "express";
import { RfiService } from "../services/rfi.service";
import { NotFoundError } from "../errors/not-found.error";

export class RfiController {
  private rfiService: RfiService;

  constructor(rfiService = new RfiService()) {
    this.rfiService = rfiService;
  }

  /**
   * Generates RFIs from conflicts and returns them.
   */
  generateRfis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const rfis = await this.rfiService.generateAndPersistRfis(id);
      return res.status(200).json({
        drawingId: id,
        rfis,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  };

  /**
   * Returns cached RFIs for a drawing.
   */
  getRfis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const rfis = await this.rfiService.getRfisForDrawing(id);
      return res.status(200).json({
        drawingId: id,
        rfis,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  };

  /**
   * Updates an RFI by ID.
   */
  updateRfi = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, rfiId } = req.params;
      const { priority, subject, question, recommendation, status } = req.body;

      const rfi = await this.rfiService.updateRfi(id, rfiId, {
        priority,
        subject,
        question,
        recommendation,
        status,
      });

      return res.status(200).json(rfi);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  };
}
