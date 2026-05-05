import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import {
  getMonitoringCompaniesTree,
  getMonitoringDevices,
  getMonitoringGeofences,
  getMonitoringSummary,
} from "../controllers/monitoring.controller";
import {
  monitoringDevicesQuerySchema,
  monitoringGeofencesQuerySchema,
} from "../schemas/monitoring.schemas";

export const monitoringRoutes = Router();

monitoringRoutes.get(
  "/summary",
  authMiddleware,
  // permissionMiddleware("monitoring.read"),
  getMonitoringSummary,
);

monitoringRoutes.get(
  "/devices",
  authMiddleware,
  // permissionMiddleware("monitoring.read"),
  validate({ query: monitoringDevicesQuerySchema }),
  getMonitoringDevices,
);

monitoringRoutes.get(
  "/geofences",
  authMiddleware,
  // permissionMiddleware("monitoring.read"),
  validate({ query: monitoringGeofencesQuerySchema }),
  getMonitoringGeofences,
);

monitoringRoutes.get(
  "/companies-tree",
  authMiddleware,
  // permissionMiddleware("monitoring.read"),
  getMonitoringCompaniesTree,
);
