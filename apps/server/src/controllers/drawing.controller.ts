import { Request, Response, NextFunction } from "express";
import { DrawingService } from "../services/drawing.service";
import { validateDiscipline } from "../validations/drawing.validation";

export class DrawingController {
  private drawingService: DrawingService;

  constructor(drawingService = new DrawingService()) {
    this.drawingService = drawingService;
  }

  uploadDrawing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        console.warn("[DrawingController] Upload failed: Missing file");
        return res.status(400).json({ error: "Missing file" });
      }

      const { discipline } = req.body;
      if (!discipline) {
        console.warn(`[DrawingController] Upload failed: Missing discipline for file: ${file.originalname}`);
        return res.status(400).json({ error: "Missing discipline" });
      }

      if (!validateDiscipline(discipline)) {
        console.warn(`[DrawingController] Upload failed: Invalid discipline '${discipline}' for file: ${file.originalname}`);
        return res.status(400).json({ error: "Invalid discipline" });
      }

      console.log(`[DrawingController] Received upload request for file: ${file.originalname}, discipline: ${discipline}`);

      const { drawing, isDuplicate } = await this.drawingService.handleUpload(
        file.buffer,
        file.originalname,
        discipline
      );

      const responseBody = {
        drawingId: drawing.id,
        status: drawing.status,
      };

      if (isDuplicate) {
        console.log(`[DrawingController] Duplicate drawing detected. Returning cached drawing ID: ${drawing.id}`);
        return res.status(200).json(responseBody);
      }

      console.log(`[DrawingController] New drawing uploaded successfully. Generated ID: ${drawing.id}`);
      return res.status(201).json(responseBody);
    } catch (error) {
      console.error("[DrawingController] Unexpected error in uploadDrawing:", error);
      next(error);
    }
  };
}
