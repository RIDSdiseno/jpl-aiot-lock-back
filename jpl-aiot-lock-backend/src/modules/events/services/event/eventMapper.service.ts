import type { DeviceEventItem } from "../../events.types";

export function mapRawDeviceEvent(raw: Partial<DeviceEventItem> & { message?: string }): DeviceEventItem {
  const text = `${raw.eventName ?? raw.events ?? raw.message ?? ""}`.toLowerCase();
  const mapped = classifyText(text);
  const now = new Date().toISOString();

  return {
    id: raw.id ?? `evt_${Date.now()}`,
    deviceId: raw.deviceId ?? "UNKNOWN",
    deviceName: raw.deviceName,
    productModel: raw.productModel,
    gpsTime: raw.gpsTime ?? raw.createdAt ?? now,
    batteryLevel: raw.batteryLevel,
    eventName: raw.eventName ?? raw.events ?? raw.message ?? mapped.eventName,
    events: raw.events ?? raw.eventName ?? raw.message ?? mapped.eventName,
    eventType: raw.eventType ?? mapped.eventType,
    lockStatus: raw.lockStatus ?? mapped.lockStatus,
    dataType: raw.dataType ?? mapped.dataType,
    latitude: raw.latitude,
    longitude: raw.longitude,
    eventImageUrl: raw.eventImageUrl ?? null,
    description: raw.description ?? raw.operatingInfo,
    operatingInfo: raw.operatingInfo ?? raw.description,
    source: raw.source ?? mapped.source,
    rawPayload: raw.rawPayload ?? raw,
    createdAt: raw.createdAt ?? now,
  };
}

function classifyText(text: string) {
  if (text.includes("ble") && text.includes("unseal")) return { eventType: "UNSEAL", eventName: "BLE-unsealing success", source: "BLE", lockStatus: "UNSEALED", dataType: "REAL_TIME" };
  if (text.includes("low battery")) return { eventType: "LOW_BATTERY", eventName: "Low battery alarm", source: "DEVICE", lockStatus: "UNKNOWN", dataType: "ALARM" };
  if (text.includes("illegal unlock")) return { eventType: "ILLEGAL_UNLOCK", eventName: "Illegal unlock alarm", source: "DEVICE", lockStatus: "UNLOCKED", dataType: "ALARM" };
  return { eventType: "UNKNOWN", eventName: "Unknown event", source: "DEVICE", lockStatus: "UNKNOWN", dataType: "REAL_TIME" };
}
