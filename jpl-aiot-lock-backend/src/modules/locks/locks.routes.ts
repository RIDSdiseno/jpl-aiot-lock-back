import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as locksController from "./locks.controller";
import { createLockSchema, lockIdParamsSchema, updateLockSchema } from "./locks.schemas";

const router = Router();

router.use(authMiddleware);
router.get("/", locksController.list);
router.get("/:id", validate({ params: lockIdParamsSchema }), locksController.getById);
router.post("/", validate({ body: createLockSchema }), locksController.create);
router.patch(
  "/:id",
  validate({ params: lockIdParamsSchema, body: updateLockSchema }),
  locksController.update,
);
router.delete("/:id", validate({ params: lockIdParamsSchema }), locksController.remove);

export default router;
