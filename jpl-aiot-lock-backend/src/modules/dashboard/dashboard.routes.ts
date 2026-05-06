import { Router } from "express";
import * as controller from "./dashboard.controller";

const router = Router();

router.get("/summary", controller.getSummary);
router.get("/system-messages", controller.getSystemMessages);
router.get("/alarm-events", controller.getAlarmEvents);
router.get("/lock-unlock-trend", controller.getLockUnlockTrend);
router.get("/device-operation-ratio", controller.getDeviceOperationRatio);
router.get("/quick-access", controller.getQuickAccess);

export default router;
