import { Router } from "express";
import { DrawingController } from "../controllers/drawing.controller";
import { uploadMiddleware } from "../middleware/multer.middleware";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const controller = new DrawingController();

router.post("/", uploadMiddleware, controller.uploadDrawing);
router.get("/", controller.getAllDrawings);
router.get("/projects", controller.getProjects);
router.get("/projects/:projectName", controller.getProjectDetails);
router.delete("/:id", authMiddleware, controller.deleteDrawing);

export default router;
