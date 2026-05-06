import { NextFunction, Request, Response } from "express";
import { ok } from "../control.mapper";
import { hasControlPermission, requireControlPermission } from "../shared/control-permissions.service";
import * as service from "./password.service";

export function getDynamicPassword(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PASSWORD_VIEW");
    res.json(ok(service.getDynamicPassword(req.params.deviceId, hasControlPermission(req, "CONTROL_PASSWORD_REVEAL"), req.user?.id)));
  } catch (error) {
    next(error);
  }
}
