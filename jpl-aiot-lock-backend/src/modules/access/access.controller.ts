import { NextFunction, Request, Response } from "express";
import * as accessService from "./access.service";

export async function assign(req: Request, res: Response, next: NextFunction) {
  try {
    const access = await accessService.assignAccess(req.params.lockId, req.body, req.user?.id);
    return res.status(201).json({ ok: true, data: access });
  } catch (error) {
    return next(error);
  }
}

export async function listByLock(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await accessService.listLockAccess(req.params.lockId) });
  } catch (error) {
    return next(error);
  }
}

export async function listByUser(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await accessService.listUserLocks(req.params.userId) });
  } catch (error) {
    return next(error);
  }
}

export async function revoke(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({
      ok: true,
      data: await accessService.revokeAccess(
        req.params.lockId,
        req.params.accessId,
        req.user?.id,
      ),
    });
  } catch (error) {
    return next(error);
  }
}
