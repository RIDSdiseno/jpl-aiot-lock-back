import { Router } from "express";
import * as controller from "./control.controller";
import commandRoutes from "./commands/command-record.routes";
import nfcRoutes from "./nfc/nfc.routes";
import parameterRoutes from "./parameters/parameter.routes";
import passwordRoutes from "./password/password.routes";
import presetRoutes from "./preset/preset.routes";

const router = Router();

router.get("/devices", controller.getDevices);
router.use("/devices/:deviceId/nfc", nfcRoutes);
router.use("/devices/:deviceId/dynamic-password", passwordRoutes);
router.use("/devices/:deviceId/parameters", parameterRoutes);
router.use("/commands", commandRoutes);
router.use("/preset", presetRoutes);

router.get("/nfc/:deviceId/cards", controller.redirectNfcCards);
router.post("/nfc/:deviceId/read", controller.redirectNfcRead);
router.post("/nfc/:deviceId/sync", controller.redirectNfcSync);
router.post("/nfc/:deviceId/clear", controller.redirectNfcClear);
router.get("/password/:deviceId", controller.redirectPasswordGet);
router.post("/password/:deviceId/update", controller.redirectPasswordUpdate);
router.use("/cmd-records", commandRoutes);
router.get("/parameters/:deviceId/latest", controller.redirectParameterLatest);
router.post("/parameters/:deviceId/read", controller.redirectParameterRead);
router.patch("/parameters/:deviceId/update", controller.redirectParameterUpdate);
router.get("/parameters/:deviceId/history", controller.redirectParameterHistory);

export default router;
