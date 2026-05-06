import { Router } from "express";
import * as controller from "./control.controller";
import commandRoutes from "./commands/command-record.routes";
import nfcRoutes from "./nfc/nfc.routes";
import parameterRoutes from "./parameters/parameter.routes";
import passwordRoutes from "./password/password.routes";

const router = Router();

router.get("/devices", controller.getDevices);
router.use("/devices/:deviceId/nfc", nfcRoutes);
router.use("/devices/:deviceId/dynamic-password", passwordRoutes);
router.use("/devices/:deviceId/parameters", parameterRoutes);
router.use("/commands", commandRoutes);

export default router;
