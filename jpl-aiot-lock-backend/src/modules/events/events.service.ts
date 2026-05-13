import { eventRepository } from "./event.repository";
import type { AlarmEventItem, DeviceEventItem, EventQueryParams, LegacyPaginatedResponse, PaginatedResponse, PushEventItem } from "./events.types";
import { listPushHistory } from "./services/event/pushEvent.service";

export function listAllEvents(params: EventQueryParams): PaginatedResponse<DeviceEventItem> {
  console.log("[EVENT][ALL_LIST]", compactLog(params));
  const items = eventRepository.listAll().filter((item) => {
    return (
      includes(item.productModel, params.productModel) &&
      includes(item.deviceId, params.deviceId) &&
      includes(item.eventType, params.eventType) &&
      includes(item.dataType, params.dataType) &&
      inDateRange(item.gpsTime, params.startDate, params.endDate)
    );
  });

  return paginate(sortItems(items, params), params);
}

export function listAlarmEvents(params: EventQueryParams): PaginatedResponse<AlarmEventItem> {
  console.log("[EVENT][ALARM_LIST]", compactLog(params));
  const items = eventRepository.listAlarms().filter((item) => {
    return (
      includes(item.productModel, params.productModel) &&
      includes(item.deviceId, params.deviceId) &&
      includes(item.alarmType, params.alarmType) &&
      includes(item.dataType, params.dataType) &&
      inDateRange(item.gpsTime, params.startDate, params.endDate)
    );
  });

  return paginate(sortItems(items, params), params);
}

export function listPushEvents(params: EventQueryParams): PaginatedResponse<PushEventItem> {
  console.log("[EVENT][PUSH_LIST]", compactLog(params));
  return paginate(sortItems(listPushHistory(params), params), params);
}

export function listEvents() {
  return eventRepository.listAll().map((event) => ({
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
    allEvents: eventRepository.listAll().length,
    alarms: eventRepository.listAlarms().length,
    pushEvents: eventRepository.listPush().length,
    criticalAlarms: eventRepository.listAlarms().filter((event) => event.alarmLevel === "CRITICAL").length,
  };
}

export function getEventDetail(eventId: string) {
  console.log("[EVENT][DETAIL]", { eventId });
  return eventRepository.findEventById(eventId);
}

export function updateAlarmStatus(alarmId: string, status: "NEW" | "REVIEWED" | "RESOLVED" | "DISMISSED") {
  console.log("[EVENT][ALARM_STATUS_UPDATE]", { alarmId, status });
  return eventRepository.updateAlarmStatus(alarmId, status);
}

export function getOptions() {
  console.log("[EVENT][OPTIONS_LOAD]");
  return {
    productModels: ["G300N", "G500N"],
    eventTypes: ["LOCK", "UNLOCK", "SEAL", "UNSEAL", "SHACKLE_OPEN", "SHACKLE_CLOSED", "LOW_BATTERY", "ILLEGAL_UNLOCK", "GEOFENCE_EXIT", "OVERSPEED", "DEVICE_OFFLINE", "GPS_FAILURE"],
    alarmTypes: ["Low battery alarm", "Illegal unlock alarm", "Shackle open alarm", "Shackle cut alarm", "Vibration alarm", "Tamper alarm", "Overspeed alarm", "Geofence alarm", "Parking timeout alarm", "Device offline alarm", "GPS failure alarm", "Storage failure alarm", "Network abnormal alarm", "Seal abnormal alarm", "Unseal abnormal alarm", "Unknown alarm"],
    dataTypes: ["REAL_TIME", "SUPPLEMENTARY", "OFFLINE", "HISTORICAL", "ALARM", "COMMAND_RESPONSE"],
    lockStatuses: ["SEALED", "UNSEALED", "LOCKED", "UNLOCKED", "OPEN", "CLOSED", "UNKNOWN"],
    pushTypes: ["E-mail", "App Push", "SMS", "Webhook"],
    pushStatuses: ["PENDING", "SENT", "FAILED", "RETRYING", "UNKNOWN"],
  };
}

function paginate<T>(items: T[], params: EventQueryParams): PaginatedResponse<T> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const start = (page - 1) * limit;
  const totalPages = Math.ceil(items.length / limit);

  return {
    data: items.slice(start, start + limit).map((item, index) => ({ ...item, sortNo: start + index + 1 })),
    pagination: { page, limit, total: items.length, totalPages },
  };
}

export function toLegacy<T>(response: PaginatedResponse<T>): LegacyPaginatedResponse<T> {
  return {
    items: response.data,
    total: response.pagination.total,
    page: response.pagination.page,
    pageSize: response.pagination.limit,
  };
}

function includes(value?: string, filter?: string) {
  if (!filter) return true;
  return (value ?? "").toLowerCase().includes(filter.toLowerCase());
}

function sortItems<T extends object>(items: T[], params: EventQueryParams): T[] {
  const sortBy = params.sortBy;
  if (!sortBy) return items;
  const allowed = new Set(["gpsTime", "batteryLevel", "deviceName", "productModel", "eventType", "alarmLevel", "sendTime"]);
  if (!allowed.has(sortBy)) return items;
  return [...items].sort((a, b) => {
    const left = (a as Record<string, unknown>)[sortBy];
    const right = (b as Record<string, unknown>)[sortBy];
    const direction = params.sortOrder === "ASC" ? 1 : -1;
    return String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true }) * direction;
  });
}

function compactLog(params: EventQueryParams) {
  return { ...params, rawPayload: undefined };
}

function inDateRange(value?: string, from?: string, to?: string) {
  if (!value) return true;
  const time = new Date(value).getTime();
  if (from && time < new Date(from).getTime()) return false;
  if (to && time > new Date(to).getTime()) return false;
  return true;
}
