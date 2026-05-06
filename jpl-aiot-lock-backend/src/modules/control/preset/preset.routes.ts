import { Router } from "express";
import * as controller from "./preset.controller";

const router = Router();

router.post("/", controller.createPreset);
router.post("/batch-card-binding", controller.createBatchCardBinding);

export default router;
