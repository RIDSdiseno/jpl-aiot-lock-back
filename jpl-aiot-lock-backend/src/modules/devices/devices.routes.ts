import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import * as controller from "./devices.controller";

const router = Router();

router.use(authMiddleware);
router.get("/summary", controller.summary);
router.get("/options", controller.options);
router.get("/export", controller.exportCsv);
router.get("/", controller.list);
router.post("/", controller.create);
router.post("/batch", controller.batchCreate);
router.patch("/batch", controller.batchModify);
router.patch("/batch/assign-company", controller.batchAssignCompany);
router.delete("/batch", controller.batchDelete);
router.post("/batch-delete", controller.batchDelete);
router.post("/batch-modify", controller.batchModify);
router.post("/batch-assign-company", controller.batchAssignCompany);
router.post("/batch-alarm-policy", controller.batchAlarmPolicy);
router.post("/export", controller.exportCsv);
router.get("/:id/slaves", controller.slaves);
router.get("/:id/alarm-strategy", controller.alarmStrategy);
router.post("/:id/alarm-strategy", controller.setAlarmStrategy);
router.get("/:id", controller.get);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
