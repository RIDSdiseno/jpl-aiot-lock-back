import { allEventsMock, alarmEventsMock, pushEventsMock } from "./shared/events-mock.provider";
import type { AlarmEventItem, DeviceEventItem, EventQueryParams, PaginatedResponse, PushEventItem } from "./events.types";

export function listAllEvents(params: EventQueryParams): PaginatedResponse<DeviceEventItem> {
  const items = allEventsMock.filter((item) => {
    return (
      includes(item.productModel, params.productModel) &&
      includes(item.deviceId, params.deviceId) &&
      includes(item.eventType, params.eventType) &&
      includes(item.dataType, params.dataType) &&
      inDateRange(item.gpsTime, params.gpsTimeFrom, params.gpsTimeTo)
    );
  });

  return paginate(items, params);
}

export function listAlarmEvents(params: EventQueryParams): PaginatedResponse<AlarmEventItem> {
  const items = alarmEventsMock.filter((item) => {
    return (
      includes(item.productModel, params.productModel) &&
      includes(item.deviceId, params.deviceId) &&
      includes(item.alarmEvent, params.alarmEvent) &&
      includes(item.dataType, params.dataType) &&
      inDateRange(item.gpsTime, params.gpsTimeFrom, params.gpsTimeTo)
    );
  });

  return paginate(items, params);
}

export function listPushEvents(params: EventQueryParams): PaginatedResponse<PushEventItem> {
  const items = pushEventsMock.filter((item) => {
    return (
      includes(item.deviceId, params.deviceId) &&
      includes(item.affiliatedCompany, params.affiliatedCompany) &&
      inDateRange(item.sendTime, params.sendTimeFrom, params.sendTimeTo)
    );
  });

  return paginate(items, params);
}

export function listEvents() {
  return allEventsMock.map((event) => ({
    id: event.id,
    deviceId: event.deviceId,
    deviceName: event.deviceName,
    type: event.eventType,
    message: event.operatingInfo,
    batteryLevel: event.batteryLevel,
    signalLevel: null,
    createdAt: event.createdAt,
  }));
}

export function listLockEvents(lockId: string) {
  return listEvents().filter((event) => event.deviceId === lockId);
}

export function getSummary() {
  return {
    allEvents: allEventsMock.length,
    alarms: alarmEventsMock.length,
    pushEvents: pushEventsMock.length,
    criticalAlarms: alarmEventsMock.filter((event) => event.severity === "CRITICAL").length,
  };
}

function paginate<T>(items: T[], params: EventQueryParams): PaginatedResponse<T> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

function includes(value?: string, filter?: string) {
  if (!filter) return true;
  return (value ?? "").toLowerCase().includes(filter.toLowerCase());
}

function inDateRange(value?: string, from?: string, to?: string) {
  if (!value) return true;
  const time = new Date(value).getTime();
  if (from && time < new Date(from).getTime()) return false;
  if (to && time > new Date(to).getTime()) return false;
  return true;
}
