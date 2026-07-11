import { Router } from "express";
import { AnalysisController } from "../controllers/analysis.controller";

const router = Router({ mergeParams: true });
const controller = new AnalysisController();

router.post("/:id/analyze", controller.analyze);

export default router;
