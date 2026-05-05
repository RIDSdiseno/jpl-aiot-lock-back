import { NextFunction, Request, Response } from "express";
import * as monitoringService from "../services/monitoring.service";
import {
  MonitoringDevicesQueryInput,
  MonitoringGeofencesQueryInput,
} from "../schemas/monitoring.schemas";

export async function getMonitoringSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await monitoringService.getSummary(req.user ?? {});
    return res.json({ ok: true, summary });
  } catch (error) {
    return next(error);
  }
}

export async function getMonitoringDevices(req: Request, res: Response, next: NextFunction) {
  try {
    const devices = await monitoringService.getDevices(
      req.user ?? {},
      req.query as MonitoringDevicesQueryInput,
    );
    return res.json({ ok: true, devices });
  } catch (error) {
    return next(error);
  }
}

export async function getMonitoringGeofences(req: Request, res: Response, next: NextFunction) {
  try {
    const geofences = await monitoringService.getGeofences(
      req.user ?? {},
      req.query as MonitoringGeofencesQueryInput,
    );
    return res.json({ ok: true, geofences });
  } catch (error) {
    return next(error);
  }
}

export async function getMonitoringCompaniesTree(req: Request, res: Response, next: NextFunction) {
  try {
    const companies = await monitoringService.getCompaniesTree(req.user ?? {});
    return res.json({ ok: true, companies });
  } catch (error) {
    return next(error);
  }
}
