import { Router } from "express";
import { DrawingController } from "../controllers/drawing.controller";
import { uploadMiddleware } from "../middleware/multer.middleware";

const router = Router();
const controller = new DrawingController();

router.post("/", uploadMiddleware, controller.uploadDrawing);

export default router;
