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
      if (!id) {
        return res.status(400).json({ error: "Missing drawing ID" });
      }

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
      if (!id) {
        return res.status(400).json({ error: "Missing drawing ID" });
      }

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
}
