import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as gpsController from "./gps.controller";
import { createLocationSchema, gpsLockParamsSchema } from "./gps.schemas";

const router = Router();

router.get(
  "/locks/:lockId/location",
  authMiddleware,
  validate({ params: gpsLockParamsSchema }),
  gpsController.latest,
);
router.get(
  "/locks/:lockId/locations/history",
  authMiddleware,
  validate({ params: gpsLockParamsSchema }),
  gpsController.history,
);
router.post(
  "/iot/locks/:lockId/location",
  validate({ params: gpsLockParamsSchema, body: createLocationSchema }),
  gpsController.create,
);

export default router;
