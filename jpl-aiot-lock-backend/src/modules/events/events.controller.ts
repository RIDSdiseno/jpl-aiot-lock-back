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
    const result = eventsService.listAllEvents(parseEventQuery(req.query));
    return res.json({ ok: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    return next(error);
  }
}

export async function listAlarms(req: Request, res: Response, next: NextFunction) {
  try {
    const result = eventsService.listAlarmEvents(parseEventQuery(req.query));
    return res.json({ ok: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    return next(error);
  }
}

export async function listPush(req: Request, res: Response, next: NextFunction) {
  try {
    const result = eventsService.listPushEvents(parseEventQuery(req.query));
    return res.json({ ok: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    return next(error);
  }
}

export async function options(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: eventsService.getOptions() });
  } catch (error) {
    return next(error);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const event = eventsService.getEventDetail(req.params.eventId);
    return res.json({ ok: true, data: event ?? null });
  } catch (error) {
    return next(error);
  }
}

export async function updateAlarmStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.body?.status;
    if (!["NEW", "REVIEWED", "RESOLVED", "DISMISSED"].includes(status)) {
      return res.status(400).json({ ok: false, message: "Invalid alarm status" });
    }
    const alarm = eventsService.updateAlarmStatus(req.params.alarmId, status);
    return res.json({ ok: true, data: alarm });
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
    console.log("[EVENT][EXPORT_REQUEST]", { type: "all" });
    const data = eventsService.listAllEvents({ ...parseEventQuery(req.query), page: 1, limit: 100 }).data;
    console.log("[EVENT][EXPORT_SUCCESS]", { type: "all", count: data.length });
    return sendCsv(res, "all-events.csv", toCsv(data, ["sortNo", "deviceId", "deviceName", "gpsTime", "batteryLevel", "productModel", "eventName", "eventType", "lockStatus", "dataType", "latitude", "longitude", "description"]));
  } catch (error) {
    console.log("[EVENT][EXPORT_FAILED]", { type: "all" });
    return next(error);
  }
}

export async function exportAlarms(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("[EVENT][EXPORT_REQUEST]", { type: "alarms" });
    const data = eventsService.listAlarmEvents({ ...parseEventQuery(req.query), page: 1, limit: 100 }).data;
    console.log("[EVENT][EXPORT_SUCCESS]", { type: "alarms", count: data.length });
    return sendCsv(res, "alarm-events.csv", toCsv(data, ["sortNo", "deviceId", "deviceName", "productModel", "gpsTime", "batteryLevel", "alarmType", "alarmLevel", "operatingInfo", "lockStatus", "dataType", "latitude", "longitude", "status", "description"]));
  } catch (error) {
    console.log("[EVENT][EXPORT_FAILED]", { type: "alarms" });
    return next(error);
  }
}

export async function exportPush(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("[EVENT][EXPORT_REQUEST]", { type: "push" });
    const data = eventsService.listPushEvents({ ...parseEventQuery(req.query), page: 1, limit: 100 }).data;
    console.log("[EVENT][EXPORT_SUCCESS]", { type: "push", count: data.length });
    return sendCsv(res, "push-events.csv", toCsv(data, ["sortNo", "deviceId", "affiliatedCompany", "pushType", "sendingEventType", "sendTo", "sendingStatus", "sendingContent", "sendTime"]));
  } catch (error) {
    console.log("[EVENT][EXPORT_FAILED]", { type: "push" });
    return next(error);
  }
}

function sendCsv(res: Response, filename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(csv);
}
