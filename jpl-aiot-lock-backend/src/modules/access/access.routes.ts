import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as accessController from "./access.controller";
import {
  createAccessSchema,
  lockAccessParamsSchema,
  revokeAccessParamsSchema,
  userLocksParamsSchema,
} from "./access.schemas";

const router = Router();

router.use(authMiddleware);
router.post(
  "/locks/:lockId/access",
  validate({ params: lockAccessParamsSchema, body: createAccessSchema }),
  accessController.assign,
);
router.get(
  "/locks/:lockId/access",
  validate({ params: lockAccessParamsSchema }),
  accessController.listByLock,
);
router.get(
  "/users/:userId/locks",
  validate({ params: userLocksParamsSchema }),
  accessController.listByUser,
);
router.delete(
  "/locks/:lockId/access/:accessId",
  validate({ params: revokeAccessParamsSchema }),
  accessController.revoke,
);

export default router;
