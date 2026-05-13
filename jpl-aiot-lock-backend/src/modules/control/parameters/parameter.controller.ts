import { NextFunction, Request, Response } from "express";
import { ok } from "../control.mapper";
import { requireControlPermission } from "../shared/control-permissions.service";
import * as service from "./parameter.service";

export function schema(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(ok(service.getSchema()));
  } catch (error) {
    next(error);
  }
}

export function devices(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_VIEW");
    res.json(ok(service.getDevices(req.query as Record<string, string>)));
  } catch (error) {
    next(error);
  }
}

export async function latest(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_VIEW");
    res.json(ok(await service.getLatest(req.params.deviceId)));
  } catch (error) {
    next(error);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_VIEW");
    res.json(ok(await service.getParameters(req.params.deviceId)));
  } catch (error) {
    next(error);
  }
}

export async function read(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_READ");
    const result = await service.readParameters(req.params.deviceId, req.user?.id);
    res.status(result.ok === false ? 409 : 200).json(result.ok === false ? result : ok(result));
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_UPDATE");
    const updates = req.body.parameters ?? req.body.fields ?? [];
    const result = await service.updateParameters(req.params.deviceId, updates, req.user?.id);
    res.status(result.ok === false ? 409 : 200).json(result.ok === false ? result : ok(result));
  } catch (error) {
    next(error);
  }
}

export async function reserve(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_RESERVE_COMMAND");
    res.json(ok(await service.reserveParameterCommand(req.params.deviceId, req.user?.id)));
  } catch (error) {
    next(error);
  }
}

export async function reservations(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_VIEW");
    res.json(ok(await service.getReservations(req.params.deviceId)));
  } catch (error) {
    next(error);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_VIEW");
    res.json(ok(await service.getHistory(req.params.deviceId)));
  } catch (error) {
    next(error);
  }
}

export async function snapshots(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_PARAMETER_VIEW");
    res.json(ok(await service.getSnapshots(req.params.deviceId)));
  } catch (error) {
    next(error);
  }
}
