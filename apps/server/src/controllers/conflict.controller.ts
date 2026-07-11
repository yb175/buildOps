import { Request, Response, NextFunction } from "express";
import { ConflictService } from "../services/conflict.service";
import { NotFoundError } from "../errors/not-found.error";

export class ConflictController {
  private conflictService: ConflictService;

  constructor(conflictService = new ConflictService()) {
    this.conflictService = conflictService;
  }

  /**
   * Run conflict detection and return results.
   */
  runConflictDetection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Missing drawing ID" });
      }

      const conflicts = await this.conflictService.detectAndPersistConflicts(id);
      return res.status(200).json({
        drawingId: id,
        conflicts,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  };

  /**
   * Get already persisted conflicts.
   */
  getConflicts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Missing drawing ID" });
      }

      const conflicts = await this.conflictService.getConflictsForDrawing(id);
      return res.status(200).json({
        drawingId: id,
        conflicts,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  };
}
