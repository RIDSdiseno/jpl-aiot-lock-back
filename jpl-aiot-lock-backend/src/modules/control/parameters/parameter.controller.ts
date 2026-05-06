import { NextFunction, Request, Response } from "express";
import { ok } from "../control.mapper";
import type { DeviceParameterField } from "../control.types";
import { requireControlPermission } from "../shared/control-permissions.service";
import * as service from "./parameter.service";

export function get(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_VIEW");
    res.json(ok(service.getParameters(req.params.deviceId)));
  } catch (error) {
    next(error);
  }
}

export function read(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_READ");
    res.json(ok(service.readParameters(req.params.deviceId, req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function update(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_UPDATE");
    res.json(ok(service.updateParameters(req.params.deviceId, req.body.fields as DeviceParameterField[], req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function reserve(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_RESERVE_COMMAND");
    res.json(ok(service.reserveParameterCommand(req.params.deviceId, req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function snapshots(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_VIEW");
    res.json(ok(service.getSnapshots(req.params.deviceId)));
  } catch (error) {
    next(error);
  }
}
