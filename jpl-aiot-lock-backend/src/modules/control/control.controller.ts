import { NextFunction, Request, Response } from "express";
import { ok } from "./control.mapper";
import * as service from "./control.service";
import { requireControlPermission } from "./shared/control-permissions.service";

export function getDevices(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_VIEW");
    res.json(ok(service.getDevices(req.query as { status?: string; type?: string; search?: string })));
  } catch (error) {
    next(error);
  }
}
