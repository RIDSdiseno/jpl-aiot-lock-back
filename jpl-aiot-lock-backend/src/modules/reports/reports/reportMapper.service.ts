import type { DeviceEventItem } from "../../events/events.types";
import type { LockUnlockReportItem } from "../report.types";

const EVENT_LABELS: Record<string, string> = {
  LOCK: "Lock",
  UNLOCK: "Unlock",
  SEAL: "Seal",
  UNSEAL: "Unseal",
  SHACKLE_OPEN: "Shackle opened",
  SHACKLE_OPENED: "Shackle opened",
  SHACKLE_CLOSED: "Shackle closed",
  ILLEGAL_UNLOCK: "Illegal unlock",
  REMOTE_LOCK: "Remote lock",
  REMOTE_UNLOCK: "Remote unlock",
  PASSWORD_UNLOCK: "Password unlock",
  NFC_UNLOCK: "NFC unlock",
  BLE_UNLOCK: "BLE unlock",
  APP_UNLOCK: "APP unlock",
  AUTO_LOCK: "Auto lock",
  COMMAND_LOCK: "Command lock",
  COMMAND_UNLOCK: "Command unlock",
};

const DATA_TYPE_LABELS: Record<string, string> = {
  REAL_TIME: "Real-time",
  REALTIME: "Real-time",
  SUPPLEMENTARY: "Supplementary",
  OFFLINE: "Offline",
  HISTORICAL: "Historical",
  ALARM: "Alarm",
  COMMAND_RESPONSE: "Command response",
};

export function mapDeviceEventToLockUnlockReport(event: DeviceEventItem): LockUnlockReportItem {
  const eventLabel = normalizeEvent(event.eventType, event.eventName ?? event.events ?? event.operatingInfo);
  const operatingInfo = normalizeOperatingInfo(event.operatingInfo ?? event.eventName ?? event.events, eventLabel);

  return {
    id: event.id,
    deviceId: event.deviceId,
    deviceName: event.deviceName,
    productModel: event.productModel,
    gpsTime: event.gpsTime ?? event.createdAt,
    event: eventLabel,
    eventType: event.eventType,
    operatingInfo,
    dataType: normalizeDataType(event.dataType),
    eventImageUrl: event.eventImageUrl ?? null,
    latitude: validCoordinate(event.latitude, -90, 90) ? event.latitude : null,
    longitude: validCoordinate(event.longitude, -180, 180) ? event.longitude : null,
    operateUser: "JPL",
    description: event.description ?? operatingInfo,
    source: event.source,
    rawPayload: event.rawPayload,
    createdAt: event.createdAt,
  };
}

export function normalizeEvent(eventType?: string, text?: string) {
  const upperType = String(eventType ?? "").toUpperCase();
  if (EVENT_LABELS[upperType]) return EVENT_LABELS[upperType];

  const lower = String(text ?? "").toLowerCase();
  if (lower.includes("ble") && lower.includes("unlock")) return "BLE unlock";
  if (lower.includes("app") && lower.includes("unlock")) return "APP unlock";
  if (lower.includes("nfc") && lower.includes("unlock")) return "NFC unlock";
  if (lower.includes("password") && lower.includes("unlock")) return "Password unlock";
  if (lower.includes("remote") && lower.includes("unlock")) return "Remote unlock";
  if (lower.includes("remote") && lower.includes("lock")) return "Remote lock";
  if (lower.includes("unseal")) return "Unseal";
  if (lower.includes("seal")) return "Seal";
  if (lower.includes("unlock")) return "Unlock";
  if (lower.includes("lock")) return "Lock";
  return "Unlock";
}

export function normalizeDataType(value?: string) {
  if (!value) return "Real-time";
  return DATA_TYPE_LABELS[value.toUpperCase()] ?? value;
}

function normalizeOperatingInfo(value: string | undefined, eventLabel: string) {
  if (value && value.trim()) return value.trim();
  return `${eventLabel} reported by device`;
}

function validCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}
