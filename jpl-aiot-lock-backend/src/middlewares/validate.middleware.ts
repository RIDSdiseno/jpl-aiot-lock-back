import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";

type RequestSchema = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export function validate(schema: RequestSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) req.query = schema.query.parse(req.query);
      if (schema.params) req.params = schema.params.parse(req.params);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          ok: false,
          message: "Validation error",
          errors: error.flatten(),
        });
      }

      return next(error);
    }
  };
}
