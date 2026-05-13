import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import * as reportController from "./report.controller";

const router = Router();

router.use(authMiddleware);
router.get("/reports/options", reportController.options);
router.get("/reports/lock-unlock", reportController.listLockUnlock);
router.get("/reports/lock-unlock/export", reportController.exportLockUnlock);
router.get("/reports/:reportType/:id", reportController.detail);

export default router;
