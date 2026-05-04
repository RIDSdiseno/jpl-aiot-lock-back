import { NextFunction, Request, Response } from "express";
import * as alertsService from "./alerts.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await alertsService.listAlerts() });
  } catch (error) {
    return next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await alertsService.getAlertById(req.params.id) });
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({
      ok: true,
      data: await alertsService.updateAlert(req.params.id, req.body, req.user?.id),
    });
  } catch (error) {
    return next(error);
  }
}
