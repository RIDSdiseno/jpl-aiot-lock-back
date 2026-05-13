import { Router } from "express";
import * as controller from "./parameter.controller";

const router = Router({ mergeParams: true });

router.get("/schema", controller.schema);
router.get("/devices", controller.devices);
router.get("/devices/:deviceId/latest", controller.latest);
router.post("/devices/:deviceId/read", controller.read);
router.patch("/devices/:deviceId/update", controller.update);
router.get("/devices/:deviceId/history", controller.history);
router.post("/devices/:deviceId/reserve", controller.reserve);
router.get("/devices/:deviceId/reservations", controller.reservations);

router.get("/", controller.get);
router.post("/read", controller.read);
router.patch("/", controller.update);
router.post("/reserve-command", controller.reserve);
router.get("/reservations", controller.reservations);
router.get("/snapshots", controller.snapshots);
router.get("/history", controller.history);

export default router;
