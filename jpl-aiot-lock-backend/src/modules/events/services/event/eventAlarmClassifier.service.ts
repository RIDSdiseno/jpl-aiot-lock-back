import type { AlarmEventItem, DeviceEventItem } from "../../events.types";

const alarmTypeByEvent: Record<string, string> = {
  LOW_BATTERY: "Low battery alarm",
  ILLEGAL_UNLOCK: "Illegal unlock alarm",
  SHACKLE_OPEN: "Shackle open alarm",
  SHACKLE_CUT: "Shackle cut alarm",
  VIBRATION: "Vibration alarm",
  TAMPER: "Tamper alarm",
  OVERSPEED: "Overspeed alarm",
  GEOFENCE_EXIT: "Geofence alarm",
  PARKING_TIMEOUT: "Parking timeout alarm",
  DEVICE_OFFLINE: "Device offline alarm",
  GPS_FAILURE: "GPS failure alarm",
  STORAGE_FAILURE: "Storage failure alarm",
  NETWORK_ABNORMAL: "Network abnormal alarm",
  SEAL_ABNORMAL: "Seal abnormal alarm",
  UNSEAL_ABNORMAL: "Unseal abnormal alarm",
};

export function classifyAlarm(event: DeviceEventItem): AlarmEventItem | null {
  const alarmType = alarmTypeByEvent[event.eventType];
  if (!alarmType) return null;

  const alarmLevel = getAlarmLevel(event);
  return {
    id: `alarm_${event.id}`,
    eventId: event.id,
    deviceId: event.deviceId,
    deviceName: event.deviceName,
    productModel: event.productModel,
    gpsTime: event.gpsTime,
    batteryLevel: event.batteryLevel,
    alarmType,
    alarmEvent: alarmType,
    alarmLevel,
    severity: alarmLevel,
    operatingInfo: event.operatingInfo ?? event.description,
    lockStatus: event.lockStatus,
    dataType: event.dataType,
    latitude: event.latitude,
    longitude: event.longitude,
    eventImageUrl: event.eventImageUrl,
    description: event.description,
    status: "NEW",
    handledStatus: "NEW",
    rawPayload: event.rawPayload,
    createdAt: event.createdAt,
  };
}

function getAlarmLevel(event: DeviceEventItem): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (["ILLEGAL_UNLOCK", "SHACKLE_CUT"].includes(event.eventType)) return "CRITICAL";
  if (["TAMPER", "GEOFENCE_EXIT", "OVERSPEED", "SEAL_ABNORMAL", "UNSEAL_ABNORMAL"].includes(event.eventType)) return "HIGH";
  if (event.eventType === "LOW_BATTERY") return typeof event.batteryLevel === "number" && event.batteryLevel <= 10 ? "HIGH" : "MEDIUM";
  if (event.eventType === "PARKING_TIMEOUT") return "LOW";
  return "MEDIUM";
}
