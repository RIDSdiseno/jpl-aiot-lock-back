import { Router } from "express";
import * as controller from "./password.controller";

const router = Router({ mergeParams: true });

router.get("/", controller.getDynamicPassword);

export default router;
