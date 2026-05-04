import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { lockRouteParamsSchema } from "../locks/locks.schemas";
import * as eventsController from "./events.controller";

const router = Router();

router.use(authMiddleware);
router.get("/events", eventsController.list);
router.get(
  "/locks/:lockId/events",
  validate({ params: lockRouteParamsSchema }),
  eventsController.listByLock,
);

export default router;
