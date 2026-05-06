import type { AlarmEventItem, DeviceEventItem, EventSeverity, PushEventItem } from "../events.types";

const devices = ["708049716223", "708049716934", "708047661918", "553071206102", "553071206110", "553071206144", "553071206094"];
const models = ["Smart Lock", "GPS Tracker", "E-Seal", "Smart Sensor"];
const eventTypes = ["LOW_BATTERY", "LOCK", "UNLOCK", "DEVICE_ONLINE", "DEVICE_OFFLINE", "PARAMETER_UPDATE", "NFC_USED", "PASSWORD_USED"];
const alarmTypes = ["LOW_BATTERY_THRESHOLD", "CUT_ALARM", "DISMANTLE_ALARM", "UNAUTHORIZED_UNLOCK", "GEOFENCE_EXIT", "DEVICE_OFFLINE", "WEAK_SIGNAL", "SHACKLE_OPEN", "TAMPER_ALARM"];
const severities: EventSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statuses = ["SENT", "FAILED", "UNKNOWN"];

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
    events: eventType.replace(/_/g, " "),
    eventType,
    lockStatus: index % 3 === 0 ? "Unlocked" : "Locked",
    dataType: index % 2 === 0 ? "GPS" : "Device",
    latitude: -33.4489 + index * 0.002,
    longitude: -70.6693 - index * 0.002,
    locationText: "Santiago, Chile",
    operatingInfo: `${eventType.replace(/_/g, " ")} reported by device ${deviceId}`,
    severity: eventType === "LOW_BATTERY" ? "HIGH" : "INFO",
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
    alarmEvent,
    alarmReason: alarmEvent.replace(/_/g, " "),
    operatingInfo: `Alarm ${alarmEvent} detected at last telemetry point`,
    lockStatus: index % 2 === 0 ? "Locked" : "Unlocked",
    dataType: index % 2 === 0 ? "Alarm" : "GPS",
    latitude: -33.4372 + index * 0.003,
    longitude: -70.6506 - index * 0.002,
    locationText: "Santiago, Chile",
    severity: severities[index % severities.length],
    handledStatus: index % 4 === 0 ? "ACKNOWLEDGED" : "NEW",
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
    pushType: index % 9 === 0 ? "SMS" : "E-mail",
    sendingEventType: index % 4 === 0 ? "Alarm Event" : "All events",
    sendTo: index % 9 === 0 ? "+569****1422" : "Nelson.aguilar@jplservicios.cl",
    sendingStatus: statuses[index % statuses.length],
    sendingContent: `Device ${deviceId} generated notification ${index + 1}`,
    sendTime,
    createdAt: sendTime,
  };
});
