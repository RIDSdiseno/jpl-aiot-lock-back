import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import * as controller from "./monitoring.controller";

export const monitoringRoutes = Router();

monitoringRoutes.use(authMiddleware);

monitoringRoutes.get("/summary", controller.getSummary);
monitoringRoutes.get("/companies-tree", controller.getCompaniesTree);
monitoringRoutes.get("/devices/search", controller.searchDevices);
monitoringRoutes.get("/devices/:deviceId/status", controller.getDeviceStatus);
monitoringRoutes.get("/devices/:deviceId/tracking", controller.getDeviceTracking);
monitoringRoutes.get("/devices/:deviceId/location/current", controller.getCurrentLocation);
monitoringRoutes.get("/devices/:deviceId/trajectory", controller.getTrajectory);
monitoringRoutes.get("/devices/:deviceId/trajectory/export", controller.exportTrajectory);
monitoringRoutes.post("/devices/:deviceId/commands/seal", controller.sendSeal);
monitoringRoutes.post("/devices/:deviceId/commands/unseal", controller.sendUnseal);
monitoringRoutes.post("/devices/:deviceId/commands/advance", controller.sendAdvance);
monitoringRoutes.get("/devices/:deviceId/parameters", controller.getParameters);
monitoringRoutes.post("/devices/:deviceId/parameters/read", controller.readParameters);
monitoringRoutes.patch("/devices/:deviceId/parameters", controller.updateParameters);
monitoringRoutes.get("/devices/:deviceId/dynamic-password", controller.getDynamicPassword);
monitoringRoutes.get("/devices/:deviceId/nfc-cards", controller.getNfcCards);
monitoringRoutes.post("/devices/:deviceId/nfc-cards/read", controller.readNfcCards);
monitoringRoutes.post("/devices/:deviceId/nfc-cards", controller.addNfcCard);
monitoringRoutes.post("/devices/:deviceId/nfc-cards/sync", controller.syncNfcCards);
monitoringRoutes.delete("/devices/:deviceId/nfc-cards", controller.deleteNfcCards);
monitoringRoutes.get("/devices/:deviceId/geofences", controller.getDeviceGeofences);
monitoringRoutes.post("/devices/:deviceId/geofences/:geofenceId/sync", controller.syncDeviceGeofence);
monitoringRoutes.get("/devices", controller.listDevices);
monitoringRoutes.get("/geofences/search", controller.searchGeofences);
monitoringRoutes.get("/geofences", controller.listGeofences);
