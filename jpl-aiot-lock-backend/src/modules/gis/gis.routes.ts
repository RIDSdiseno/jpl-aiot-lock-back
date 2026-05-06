import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as controller from "./gis.controller";
import {
  batchDeleteSchema,
  createGeoFenceSchema,
  deviceReadParamsSchema,
  idParamsSchema,
  readDeviceFenceSchema,
  sendFenceSchema,
  updateGeoFenceSchema,
} from "./gis.schemas";

const router = Router();

router.use(authMiddleware);

router.get("/geofences", controller.listGeoFences);
router.post("/geofences/batch-delete", validate({ body: batchDeleteSchema }), controller.batchDeleteGeoFences);
router.post("/geofences/send", validate({ body: sendFenceSchema }), controller.sendGeoFences);
router.post("/geofences", validate({ body: createGeoFenceSchema }), controller.createGeoFence);
router.get("/geofences/:id", validate({ params: idParamsSchema }), controller.getGeoFence);
router.patch("/geofences/:id", validate({ params: idParamsSchema, body: updateGeoFenceSchema }), controller.updateGeoFence);
router.delete("/geofences/:id", validate({ params: idParamsSchema }), controller.deleteGeoFence);

router.get("/fence-records", controller.listFenceRecords);
router.post("/fence-records/batch-delete", validate({ body: batchDeleteSchema }), controller.batchDeleteFenceRecords);
router.post("/fence-records/stop-sending", validate({ body: batchDeleteSchema }), controller.stopSending);
router.post("/fence-records/:id/resend", validate({ params: idParamsSchema }), controller.resendFenceRecord);
router.post("/fence-records/:id/stop", validate({ params: idParamsSchema }), controller.stopFenceRecord);
router.delete("/fence-records/:id", validate({ params: idParamsSchema }), controller.deleteFenceRecord);

router.post("/devices/:deviceId/fences/read", validate({ params: deviceReadParamsSchema, body: readDeviceFenceSchema }), controller.readDeviceFences);

export default router;
