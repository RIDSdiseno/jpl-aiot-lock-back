import { NextFunction, Request, Response } from "express";
import * as locksService from "./locks.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await locksService.listLocks() });
  } catch (error) {
    return next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await locksService.getLockById(req.params.id) });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const lock = await locksService.createLock(req.body, req.user?.id);
    return res.status(201).json({ ok: true, data: lock });
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({
      ok: true,
      data: await locksService.updateLock(req.params.id, req.body, req.user?.id),
    });
  } catch (error) {
    return next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({
      ok: true,
      data: await locksService.deleteLock(req.params.id, req.user?.id),
    });
  } catch (error) {
    return next(error);
  }
}
