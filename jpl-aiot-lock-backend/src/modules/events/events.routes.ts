import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { lockRouteParamsSchema } from "../locks/locks.schemas";
import * as eventsController from "./events.controller";

const router = Router();

router.use(authMiddleware);
router.get("/events/all", eventsController.listAll);
router.get("/events/all/export", eventsController.exportAll);
router.get("/events/alarms", eventsController.listAlarms);
router.get("/events/alarms/export", eventsController.exportAlarms);
router.get("/events/push", eventsController.listPush);
router.get("/events/push/export", eventsController.exportPush);
router.get("/events/options", eventsController.options);
router.get("/events/summary", eventsController.summary);
router.get("/events/:eventId", eventsController.detail);
router.patch("/events/alarms/:alarmId/status", eventsController.updateAlarmStatus);
router.get("/events", eventsController.list);
router.get(
  "/locks/:lockId/events",
  validate({ params: lockRouteParamsSchema }),
  eventsController.listByLock,
);

export default router;
