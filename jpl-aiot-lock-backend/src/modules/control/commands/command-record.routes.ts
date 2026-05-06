import { Router } from "express";
import * as controller from "./command-record.controller";

const router = Router();

router.get("/", controller.list);
router.get("/:commandId", controller.get);
router.post("/:commandId/cancel", controller.cancel);

export default router;
