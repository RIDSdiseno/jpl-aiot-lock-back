import { NextFunction, Request, Response } from "express";
import { ok } from "./control.mapper";
import * as service from "./control.service";
import * as nfcService from "./nfc/nfc.service";
import * as parameterService from "./parameters/parameter.service";
import * as passwordService from "./password/password.service";
import { requireControlPermission } from "./shared/control-permissions.service";

export function getDevices(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_VIEW");
    res.json(ok(service.getDevices(req.query as { status?: string; type?: string; search?: string })));
  } catch (error) {
    next(error);
  }
}

export function redirectNfcCards(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_VIEW");
    res.json(ok(nfcService.getNfcCards(req.params.deviceId, req.query.block ? `Block ${req.query.block}` : "Block 1")));
  } catch (error) {
    next(error);
  }
}

export function redirectNfcRead(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_READ");
    res.json(ok(nfcService.readNfcCards(req.params.deviceId, req.body.block ? `Block ${req.body.block}` : "Block 1", req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function redirectNfcSync(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_SYNC");
    res.json(ok(nfcService.syncNfcCards(req.params.deviceId, req.user?.id, req.body.cards)));
  } catch (error) {
    next(error);
  }
}

export function redirectNfcClear(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_CLEAR");
    res.json(ok(nfcService.clearNfcCards(req.params.deviceId, req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function redirectPasswordGet(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PASSWORD_VIEW");
    res.json(ok(passwordService.getDynamicPassword(req.params.deviceId, true, req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function redirectPasswordUpdate(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PASSWORD_VIEW");
    res.json(ok(passwordService.updateDynamicPassword(req.params.deviceId, req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function redirectParameterLatest(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_VIEW");
    res.json(ok(parameterService.getParameters(req.params.deviceId)));
  } catch (error) {
    next(error);
  }
}

export function redirectParameterRead(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_READ");
    res.json(ok(parameterService.readParameters(req.params.deviceId, req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function redirectParameterUpdate(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_UPDATE");
    res.json(ok(parameterService.updateParameters(req.params.deviceId, req.body.fields ?? [], req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export function redirectParameterHistory(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_VIEW");
    res.json(ok(parameterService.getSnapshots(req.params.deviceId)));
  } catch (error) {
    next(error);
  }
}
