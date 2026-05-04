import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as companiesController from "./companies.controller";
import {
  companyIdParamsSchema,
  createCompanySchema,
  updateCompanySchema,
} from "./companies.schemas";

const router = Router();

router.use(authMiddleware);
router.get("/", companiesController.list);
router.get("/:id", validate({ params: companyIdParamsSchema }), companiesController.getById);
router.post("/", validate({ body: createCompanySchema }), companiesController.create);
router.patch(
  "/:id",
  validate({ params: companyIdParamsSchema, body: updateCompanySchema }),
  companiesController.update,
);
router.delete("/:id", validate({ params: companyIdParamsSchema }), companiesController.remove);

export default router;
