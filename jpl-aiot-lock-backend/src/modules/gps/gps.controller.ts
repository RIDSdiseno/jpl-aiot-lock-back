import { NextFunction, Request, Response } from "express";
import * as gpsService from "./gps.service";

export async function latest(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await gpsService.getLatestLocation(req.params.lockId) });
  } catch (error) {
    return next(error);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await gpsService.getLocationHistory(req.params.lockId) });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const location = await gpsService.createLocation(req.params.lockId, req.body);
    return res.status(201).json({ ok: true, data: location });
  } catch (error) {
    return next(error);
  }
}
