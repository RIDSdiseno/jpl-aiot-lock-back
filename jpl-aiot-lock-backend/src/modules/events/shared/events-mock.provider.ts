import type { AlarmEventItem, DeviceEventItem, EventSeverity, PushEventItem } from "../events.types";

const devices = ["708049716223", "708049716934", "708047661918", "553071206102", "553071206110", "553071206144", "553071206094"];
const models = ["G300N", "G500N"];
const eventTypes = ["UNSEAL", "SEAL", "LOCK", "UNLOCK", "SHACKLE_OPEN", "LOW_BATTERY", "ILLEGAL_UNLOCK", "GEOFENCE_EXIT", "OVERSPEED", "DEVICE_OFFLINE", "GPS_FAILURE", "COMMAND_RESPONSE"];
const alarmTypes = ["Low battery alarm", "Illegal unlock alarm", "Shackle open alarm", "Shackle cut alarm", "Vibration alarm", "Tamper alarm", "Overspeed alarm", "Geofence alarm", "Parking timeout alarm", "Device offline alarm", "GPS failure alarm", "Storage failure alarm", "Network abnormal alarm", "Seal abnormal alarm", "Unseal abnormal alarm", "Unknown alarm"];
const severities: Array<Exclude<EventSeverity, "INFO">> = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statuses = ["SENT", "FAILED", "RETRYING", "PENDING", "UNKNOWN"];
const alarmStatuses = ["NEW", "REVIEWED", "RESOLVED", "DISMISSED"] as const;

function timestamp(offsetHours: number) {
  return new Date(Date.UTC(2026, 3, 24, 12, 14, 33) - offsetHours * 60 * 60 * 1000).toISOString();
}

export const allEventsMock: DeviceEventItem[] = Array.from({ length: 30 }, (_, index) => {
  const deviceId = devices[index % devices.length];
  const eventType = eventTypes[index % eventTypes.length];
  const gpsTime = timestamp(index * 3);

  return {
    id: `evt-${index + 1}`,
    sortNo: index + 1,
    deviceId,
    deviceName: `AIoT Lock ${deviceId.slice(-4)}`,
    productModel: models[index % models.length],
    gpsTime,
    batteryLevel: Math.max(8, 96 - index * 2),
    eventName: eventType === "UNSEAL" ? "BLE-unsealing success" : eventType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
    events: eventType === "UNSEAL" ? "BLE-unsealing success" : eventType.replace(/_/g, " "),
    eventType,
    lockStatus: index % 3 === 0 ? "UNSEALED" : "SEALED",
    dataType: eventType.includes("ALARM") || ["LOW_BATTERY", "ILLEGAL_UNLOCK", "GEOFENCE_EXIT", "OVERSPEED", "DEVICE_OFFLINE", "GPS_FAILURE"].includes(eventType) ? "ALARM" : index % 2 === 0 ? "REAL_TIME" : "HISTORICAL",
    latitude: -23.624895 + index * 0.002,
    longitude: -70.390415 - index * 0.002,
    locationText: "Santiago, Chile",
    eventImageUrl: index % 11 === 0 ? "https://placehold.co/800x450/png?text=AIOT+Lock+Event" : null,
    description: `${eventType.replace(/_/g, " ")} reported by device ${deviceId}`,
    operatingInfo: `${eventType.replace(/_/g, " ")} reported by device ${deviceId}`,
    source: index % 4 === 0 ? "BLE" : "DEVICE",
    severity: eventType === "LOW_BATTERY" ? "HIGH" : "INFO",
    rawPayload: { provider: "HHDLink", eventType, sequence: index + 1 },
    createdAt: gpsTime,
  };
});

export const alarmEventsMock: AlarmEventItem[] = Array.from({ length: 10 }, (_, index) => {
  const deviceId = devices[index % devices.length];
  const alarmEvent = alarmTypes[index % alarmTypes.length];
  const gpsTime = timestamp(index * 6);

  return {
    id: `alarm-${index + 1}`,
    sortNo: index + 1,
    deviceId,
    deviceName: `AIoT Lock ${deviceId.slice(-4)}`,
    productModel: models[index % models.length],
    gpsTime,
    batteryLevel: Math.max(5, 42 - index * 3),
    eventId: `evt-${index + 1}`,
    alarmType: alarmEvent,
    alarmEvent,
    alarmLevel: severities[index % severities.length],
    alarmReason: alarmEvent,
    operatingInfo: `Alarm ${alarmEvent} detected at last telemetry point`,
    lockStatus: index % 2 === 0 ? "SEALED" : "UNSEALED",
    dataType: "ALARM",
    latitude: -23.624895 + index * 0.003,
    longitude: -70.390415 - index * 0.002,
    locationText: "Santiago, Chile",
    eventImageUrl: index % 7 === 0 ? "https://placehold.co/800x450/png?text=Alarm+Evidence" : null,
    description: `${alarmEvent} detected`,
    severity: severities[index % severities.length],
    status: alarmStatuses[index % alarmStatuses.length],
    handledStatus: alarmStatuses[index % alarmStatuses.length],
    rawPayload: { provider: "HHDLink", alarmEvent, sequence: index + 1 },
    createdAt: gpsTime,
  };
});

export const pushEventsMock: PushEventItem[] = Array.from({ length: 50 }, (_, index) => {
  const sendTime = timestamp(index * 2);
  const deviceId = index % 5 === 0 ? devices[index % devices.length] : "708049716223";

  return {
    id: `push-${index + 1}`,
    sortNo: index + 1,
    deviceId,
    affiliatedCompany: index % 7 === 0 ? "DEMO" : "JPL Servicios Integrales LTDA",
    pushType: index % 13 === 0 ? "Webhook" : index % 9 === 0 ? "SMS" : index % 5 === 0 ? "App Push" : "E-mail",
    sendingEventType: index % 4 === 0 ? "Alarm event" : "All events",
    sendTo: index % 9 === 0 ? "+569****1422" : "Nelson.aguilar@jplservicios.cl",
    sendingStatus: statuses[index % statuses.length],
    sendingContent: `${deviceId}(G300N24CL${String(10173 + index).padStart(5, "0")}) reported event notification ${index + 1}`,
    sendTime,
    createdAt: sendTime,
    rawPayload: { provider: "HHDLink", sequence: index + 1 },
  };
});
