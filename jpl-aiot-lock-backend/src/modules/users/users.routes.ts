import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as usersController from "./users.controller";
import { createUserSchema, idParamsSchema, updateUserSchema } from "./users.schemas";

const router = Router();

router.use(authMiddleware);
router.get("/", usersController.list);
router.get("/:id", validate({ params: idParamsSchema }), usersController.getById);
router.post("/", validate({ body: createUserSchema }), usersController.create);
router.patch(
  "/:id",
  validate({ params: idParamsSchema, body: updateUserSchema }),
  usersController.update,
);
router.delete("/:id", validate({ params: idParamsSchema }), usersController.remove);

export default router;
