import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as authController from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schemas";

const router = Router();

router.post("/register", validate({ body: registerSchema }), authController.register);
router.post("/login", validate({ body: loginSchema }), authController.login);
router.get("/me", authMiddleware, authController.me);

export default router;
