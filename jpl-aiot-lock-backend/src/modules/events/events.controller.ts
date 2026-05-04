import { NextFunction, Request, Response } from "express";
import * as eventsService from "./events.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await eventsService.listEvents() });
  } catch (error) {
    return next(error);
  }
}

export async function listByLock(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await eventsService.listLockEvents(req.params.lockId) });
  } catch (error) {
    return next(error);
  }
}
