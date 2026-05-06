import { Router } from "express";
import * as controller from "./parameter.controller";

const router = Router({ mergeParams: true });

router.get("/", controller.get);
router.post("/read", controller.read);
router.patch("/", controller.update);
router.post("/reserve-command", controller.reserve);
router.get("/snapshots", controller.snapshots);

export default router;
