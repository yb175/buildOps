import { Router } from "express";
import { RfiController } from "../controllers/rfi.controller";

const router = Router({ mergeParams: true });
const controller = new RfiController();

router.post("/:id/rfis", controller.generateRfis);
router.get("/:id/rfis", controller.getRfis);
router.put("/:id/rfis/:rfiId", controller.updateRfi);

export default router;
