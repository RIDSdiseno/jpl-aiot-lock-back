import { Router } from "express";
import * as controller from "./nfc.controller";

const router = Router({ mergeParams: true });

router.get("/", controller.getCards);
router.post("/read", controller.readCards);
router.post("/cards", controller.addCard);
router.post("/sync", controller.syncCards);
router.delete("/clear", controller.clearCards);
router.post("/reserve-command", controller.reserveCommand);

export default router;
