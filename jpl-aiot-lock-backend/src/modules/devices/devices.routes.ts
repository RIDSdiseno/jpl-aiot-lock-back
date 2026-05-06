import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import * as controller from "./devices.controller";

const router = Router();

router.use(authMiddleware);
router.get("/", controller.list);
router.get("/summary", controller.summary);
router.post("/", controller.create);
router.post("/batch", controller.batchCreate);
router.post("/batch-delete", controller.batchDelete);
router.post("/batch-modify", controller.batchModify);
router.post("/batch-assign-company", controller.batchAssignCompany);
router.post("/batch-alarm-policy", controller.batchAlarmPolicy);
router.post("/export", controller.exportCsv);
router.get("/:id", controller.get);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);
router.get("/:id/alarm-strategy", controller.alarmStrategy);
router.post("/:id/alarm-strategy", controller.setAlarmStrategy);

export default router;
