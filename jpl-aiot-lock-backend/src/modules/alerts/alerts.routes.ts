import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as alertsController from "./alerts.controller";
import { alertIdParamsSchema, updateAlertSchema } from "./alerts.schemas";

const router = Router();

router.use(authMiddleware);
router.get("/", alertsController.list);
router.get("/:id", validate({ params: alertIdParamsSchema }), alertsController.getById);
router.patch(
  "/:id",
  validate({ params: alertIdParamsSchema, body: updateAlertSchema }),
  alertsController.update,
);

export default router;
