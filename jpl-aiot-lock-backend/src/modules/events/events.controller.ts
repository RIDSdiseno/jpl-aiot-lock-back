import { NextFunction, Request, Response } from "express";
import { parseEventQuery, toCsv } from "./events.mapper";
import * as eventsService from "./events.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await eventsService.listEvents() });
  } catch (error) {
    return next(error);
  }
}

export async function listByLock(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await eventsService.listLockEvents(req.params.lockId) });
  } catch (error) {
    return next(error);
  }
}

export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: eventsService.listAllEvents(parseEventQuery(req.query)) });
  } catch (error) {
    return next(error);
  }
}

export async function listAlarms(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: eventsService.listAlarmEvents(parseEventQuery(req.query)) });
  } catch (error) {
    return next(error);
  }
}

export async function listPush(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: eventsService.listPushEvents(parseEventQuery(req.query)) });
  } catch (error) {
    return next(error);
  }
}

export async function summary(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: eventsService.getSummary() });
  } catch (error) {
    return next(error);
  }
}

export async function exportAll(req: Request, res: Response, next: NextFunction) {
  try {
    const data = eventsService.listAllEvents({ ...parseEventQuery(req.query), page: 1, pageSize: 100 }).items;
    return sendCsv(res, "all-events.csv", toCsv(data, ["sortNo", "deviceId", "deviceName", "gpsTime", "batteryLevel", "productModel", "events", "eventType", "lockStatus", "dataType", "latitude", "longitude", "operatingInfo"]));
  } catch (error) {
    return next(error);
  }
}

export async function exportAlarms(req: Request, res: Response, next: NextFunction) {
  try {
    const data = eventsService.listAlarmEvents({ ...parseEventQuery(req.query), page: 1, pageSize: 100 }).items;
    return sendCsv(res, "alarm-events.csv", toCsv(data, ["sortNo", "deviceId", "deviceName", "productModel", "gpsTime", "batteryLevel", "alarmEvent", "operatingInfo", "lockStatus", "dataType", "latitude", "longitude", "severity", "handledStatus"]));
  } catch (error) {
    return next(error);
  }
}

export async function exportPush(req: Request, res: Response, next: NextFunction) {
  try {
    const data = eventsService.listPushEvents({ ...parseEventQuery(req.query), page: 1, pageSize: 100 }).items;
    return sendCsv(res, "push-events.csv", toCsv(data, ["sortNo", "deviceId", "affiliatedCompany", "pushType", "sendingEventType", "sendTo", "sendingStatus", "sendingContent", "sendTime"]));
  } catch (error) {
    return next(error);
  }
}

function sendCsv(res: Response, filename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(csv);
}
