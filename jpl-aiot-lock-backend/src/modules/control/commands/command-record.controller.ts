import { NextFunction, Request, Response } from "express";
import { ok } from "../control.mapper";
import { requireControlPermission } from "../shared/control-permissions.service";
import * as service from "./command-record.service";

export function list(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_CMD_RECORD_VIEW");
    res.json(ok(service.listCommandRecords(req.query as { deviceId?: string; deviceName?: string; type?: string; status?: string; content?: string; operator?: string; startDate?: string; endDate?: string })));
  } catch (error) {
    next(error);
  }
}

export function get(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_CMD_RECORD_VIEW");
    res.json(ok(service.getCommandRecord(req.params.commandId)));
  } catch (error) {
    next(error);
  }
}

export function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_CMD_RECORD_CANCEL");
    res.json(ok(service.cancelCommandRecord(req.params.commandId, req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function resend(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_CMD_RECORD_CANCEL");
    res.json(ok(service.resendCommandRecord(req.params.commandId, req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function remove(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_CMD_RECORD_CANCEL");
    res.json(ok(service.deleteCommandRecord(req.params.commandId, req.user?.id)));
  } catch (error) {
    next(error);
  }
}
