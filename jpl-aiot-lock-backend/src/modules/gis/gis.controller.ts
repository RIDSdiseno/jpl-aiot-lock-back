import { NextFunction, Request, Response } from "express";
import * as service from "./gis.service";
import type { DeviceFenceQueryType, GeoFenceInput, SendFenceInput } from "./gis.types";

function userId(req: Request) {
  return req.user?.id;
}

export async function listGeoFences(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.listGeoFences(req.query.search as string | undefined) });
  } catch (error) {
    next(error);
  }
}

export async function getGeoFence(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.getGeoFence(req.params.id) });
  } catch (error) {
    next(error);
  }
}

export async function createGeoFence(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json({ ok: true, data: await service.createGeoFence(req.body as GeoFenceInput, userId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function updateGeoFence(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.updateGeoFence(req.params.id, req.body as Partial<GeoFenceInput>, userId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function deleteGeoFence(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.deleteGeoFence(req.params.id, userId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function batchDeleteGeoFences(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.batchDeleteGeoFences(req.body.ids as string[], userId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function sendGeoFences(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json({ ok: true, data: await service.sendGeoFences(req.body as SendFenceInput, userId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function listFenceRecords(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.listFenceRecords(req.query as { deviceId?: string; deviceName?: string; status?: string; startDate?: string; endDate?: string }) });
  } catch (error) {
    next(error);
  }
}

export async function resendFenceRecord(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.resendFenceRecord(req.params.id, userId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function stopFenceRecord(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.stopFenceRecord(req.params.id, userId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function deleteFenceRecord(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.deleteFenceRecord(req.params.id) });
  } catch (error) {
    next(error);
  }
}

export async function batchDeleteFenceRecords(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.batchDeleteFenceRecords(req.body.ids as string[]) });
  } catch (error) {
    next(error);
  }
}

export async function stopSending(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, data: await service.stopSending(req.body.ids as string[], userId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function readDeviceFences(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json({
      ok: true,
      data: await service.readDeviceFences(req.params.deviceId, req.body.queryType as DeviceFenceQueryType, req.body.blockNumber as number, userId(req)),
    });
  } catch (error) {
    next(error);
  }
}
