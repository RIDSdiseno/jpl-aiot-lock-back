import { Router } from "express";
import * as controller from "./password.controller";

const router = Router({ mergeParams: true });

router.get("/", controller.getDynamicPassword);
router.post("/update", controller.updateDynamicPassword);

export default router;
