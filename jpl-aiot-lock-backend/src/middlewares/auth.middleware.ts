import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, message: "Missing access token" });
  }

  const token = authorization.replace("Bearer ", "").trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      ...payload,
      id: payload.id ?? payload.userId,
    };
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: "Invalid access token" });
  }
}
