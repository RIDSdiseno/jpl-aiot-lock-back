import { NextFunction, Request, Response } from "express";
import * as authService from "./auth.service";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json({ ok: true, data: user });
  } catch (error) {
    return next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return res.json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.me(req.user!.userId);
    return res.json({ ok: true, user });
  } catch (error) {
    return next(error);
  }
}
