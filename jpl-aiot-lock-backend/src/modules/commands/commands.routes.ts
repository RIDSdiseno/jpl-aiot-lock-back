import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { lockRouteParamsSchema } from "../locks/locks.schemas";
import * as commandsController from "./commands.controller";

const router = Router();

router.use(authMiddleware);
router.post(
  "/locks/:lockId/commands/open",
  validate({ params: lockRouteParamsSchema }),
  commandsController.open,
);
router.post(
  "/locks/:lockId/commands/close",
  validate({ params: lockRouteParamsSchema }),
  commandsController.close,
);
router.get(
  "/locks/:lockId/commands",
  validate({ params: lockRouteParamsSchema }),
  commandsController.list,
);

export default router;
