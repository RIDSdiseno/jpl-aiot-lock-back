import { Router } from "express";
import * as controller from "./command-record.controller";

const router = Router();

router.get("/", controller.list);
router.get("/:commandId", controller.get);
router.post("/:commandId/resend", controller.resend);
router.post("/:commandId/cancel", controller.cancel);
router.delete("/:commandId", controller.remove);

export default router;
