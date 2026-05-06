import { NextFunction, Request, Response } from "express";

type AppError = Error & { statusCode?: number; code?: string };

export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const appError = error as AppError;
  const statusCode = appError.statusCode ?? 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    ok: false,
    error: {
      code: appError.code ?? "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    },
  });
}
