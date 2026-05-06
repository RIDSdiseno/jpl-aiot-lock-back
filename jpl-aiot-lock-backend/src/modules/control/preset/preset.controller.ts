import { NextFunction, Request, Response } from "express";
import { ok } from "../control.mapper";
import { requireControlPermission } from "../shared/control-permissions.service";
import * as service from "./preset.service";

export function createPreset(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_RESERVE_COMMAND");
    res.json(ok(service.createPresetCommand({ deviceIds: req.body.deviceIds ?? [], payload: req.body.payload ?? req.body, userId: req.user?.id })));
  } catch (error) {
    next(error);
  }
}

export function createBatchCardBinding(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_RESERVE_COMMAND");
    res.json(ok(service.createBatchCardBinding({ deviceIds: req.body.deviceIds ?? [], cards: req.body.cards ?? [], expirationTime: String(req.body.expirationTime ?? ""), userId: req.user?.id })));
  } catch (error) {
    next(error);
  }
}
