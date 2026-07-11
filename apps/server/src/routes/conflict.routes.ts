import { Router } from "express";
import { ConflictController } from "../controllers/conflict.controller";

const router = Router({ mergeParams: true });
const controller = new ConflictController();

router.post("/:id/conflicts", controller.runConflictDetection);
router.get("/:id/conflicts", controller.getConflicts);

export default router;
