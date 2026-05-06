import { NextFunction, Request, Response } from "express";
import * as dashboard from "./dashboard.service";

export function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: dashboard.getSummary(req.query.from as string | undefined, req.query.to as string | undefined) });
  } catch (error) {
    next(error);
  }
}

export function getSystemMessages(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: dashboard.getSystemMessages() });
  } catch (error) {
    next(error);
  }
}

export function getAlarmEvents(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: dashboard.getAlarmEvents() });
  } catch (error) {
    next(error);
  }
}

export function getLockUnlockTrend(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: dashboard.getLockUnlockTrend(req.query.from as string | undefined, req.query.to as string | undefined) });
  } catch (error) {
    next(error);
  }
}

export function getDeviceOperationRatio(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: dashboard.getOperationRatio() });
  } catch (error) {
    next(error);
  }
}

export function getQuickAccess(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: dashboard.getQuickAccess() });
  } catch (error) {
    next(error);
  }
}
