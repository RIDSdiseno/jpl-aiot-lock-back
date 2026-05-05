import { Router } from "express";

export const monitoringRoutes = Router();

function currentIso(minutesAgo = 0) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

const devices = [
  {
    id: "LOCK-JPL-001",
    deviceId: "LOCK-JPL-001",
    name: "Candado Camion Santiago 001",
    status: "ONLINE",
    battery: 87,
    signal: "GOOD",
    latitude: -33.4489,
    longitude: -70.6693,
    lastReportAt: currentIso(),
    hasCutAlarm: false,
    companyId: "JPL-DEMO",
    companyName: "JPL Operaciones Demo",
    connectionMode: "LTE",
    deviceStatus: "Active",
    speed: 0,
    sim: "89560710000000001",
    lockStatus: "sealed",
    shackleStatus: "closed",
    alarmStatus: "Normal",
    events: ["DEVICE_ONLINE", "LOCATION_REPORTED"],
    positioningTime: currentIso(),
    location: "-33.448900, -70.669300",
    lastSeenAt: currentIso(),
  },
  {
    id: "LOCK-JPL-004",
    deviceId: "LOCK-JPL-004",
    name: "Candado Alarma Corte 004",
    status: "ALARM",
    battery: 74,
    signal: "GOOD",
    latitude: -33.4372,
    longitude: -70.6506,
    lastReportAt: currentIso(),
    hasCutAlarm: true,
    companyId: "JPL-DEMO",
    companyName: "JPL Operaciones Demo",
    connectionMode: "LTE",
    deviceStatus: "Alarm",
    speed: 0,
    sim: "89560710000000004",
    lockStatus: "sealed",
    shackleStatus: "closed",
    alarmStatus: "CUT_ALARM",
    events: ["CUT_ALARM", "DEMOLITION_ALARM"],
    positioningTime: currentIso(),
    location: "-33.437200, -70.650600",
    lastSeenAt: currentIso(),
  },
  {
    id: "LOCK-JPL-008",
    deviceId: "LOCK-JPL-008",
    name: "Candado Sin Reporte 008",
    status: "OFFLINE",
    battery: 0,
    signal: "NONE",
    latitude: -33.46,
    longitude: -70.7,
    lastReportAt: currentIso(1440),
    hasCutAlarm: false,
    companyId: "JPL-DEMO",
    companyName: "JPL Operaciones Demo",
    connectionMode: "LTE",
    deviceStatus: "Offline",
    speed: 0,
    sim: "89560710000000008",
    lockStatus: "sealed",
    shackleStatus: "closed",
    alarmStatus: "NO_RECENT_REPORT",
    events: ["DEVICE_OFFLINE", "NO_RECENT_REPORT"],
    positioningTime: currentIso(1440),
    location: "-33.460000, -70.700000",
    lastSeenAt: currentIso(1440),
  },
];

const geofences = [
  {
    id: "GEOFENCE-SCL-001",
    name: "Zona Operacional Santiago",
    type: "CIRCLE",
    latitude: -33.4489,
    longitude: -70.6693,
    radiusMeters: 500,
    active: true,
    companyId: "JPL-DEMO",
    companyName: "JPL Operaciones Demo",
    centerLat: -33.4489,
    centerLng: -70.6693,
    radiusMt: 500,
    isActive: true,
  },
  {
    id: "GEOFENCE-BOD-001",
    name: "Bodega Central JPL",
    type: "CIRCLE",
    latitude: -33.4372,
    longitude: -70.6506,
    radiusMeters: 300,
    active: true,
    companyId: "JPL-DEMO",
    companyName: "JPL Operaciones Demo",
    centerLat: -33.4372,
    centerLng: -70.6506,
    radiusMt: 300,
    isActive: true,
  },
];

const tracking = [
  { latitude: -33.4511, longitude: -70.6721, speed: 0, heading: 0, recordedAt: currentIso(20), reportedAt: currentIso(20), battery: 87, signal: "GOOD" },
  { latitude: -33.4504, longitude: -70.6714, speed: 8, heading: 278, recordedAt: currentIso(16), reportedAt: currentIso(16), battery: 87, signal: "GOOD" },
  { latitude: -33.4498, longitude: -70.6707, speed: 11, heading: 278, recordedAt: currentIso(12), reportedAt: currentIso(12), battery: 86, signal: "GOOD" },
  { latitude: -33.4493, longitude: -70.67, speed: 6, heading: 278, recordedAt: currentIso(8), reportedAt: currentIso(8), battery: 86, signal: "GOOD" },
  { latitude: -33.4489, longitude: -70.6693, speed: 0, heading: 0, recordedAt: currentIso(3), reportedAt: currentIso(3), battery: 87, signal: "GOOD" },
];

const events = [
  { id: "EVT-JPL-001", deviceId: "LOCK-JPL-001", type: "DEVICE_ONLINE", message: "Dispositivo en linea", createdAt: currentIso(30) },
  { id: "EVT-JPL-002", deviceId: "LOCK-JPL-001", type: "LOCATION_REPORTED", message: "Ubicacion reportada", createdAt: currentIso(20) },
  { id: "EVT-JPL-003", deviceId: "LOCK-JPL-004", type: "CUT_ALARM", message: "Alarma de corte activa", createdAt: currentIso(10) },
  { id: "EVT-JPL-004", deviceId: "LOCK-JPL-008", type: "DEVICE_OFFLINE", message: "Dispositivo fuera de linea", createdAt: currentIso(1440) },
];

const alarms = [
  { id: "ALM-JPL-001", deviceId: "LOCK-JPL-004", type: "CUT_ALARM", severity: "CRITICAL", status: "ACTIVE", message: "Alarma de corte/demolicion activa", createdAt: currentIso(10), resolvedAt: null },
  { id: "ALM-JPL-002", deviceId: "LOCK-JPL-008", type: "NO_RECENT_REPORT", severity: "HIGH", status: "ACTIVE", message: "Sin reporte reciente", createdAt: currentIso(1440), resolvedAt: null },
];

monitoringRoutes.get("/devices", (req, res) => {
  console.log("[MONITORING] GET /devices");
  const status = String(req.query.status ?? "").toUpperCase();
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const filtered = devices.filter((device) => {
    const matchesStatus = !status || status === "ALL" || device.status === status;
    const matchesText = !q || device.name.toLowerCase().includes(q) || device.deviceId.toLowerCase().includes(q);
    return matchesStatus && matchesText;
  });
  res.json({ ok: true, data: filtered, devices: filtered });
});

monitoringRoutes.get("/devices/search", (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const filtered = q
    ? devices.filter((device) => device.name.toLowerCase().includes(q) || device.deviceId.toLowerCase().includes(q))
    : devices;
  res.json({ ok: true, data: filtered, devices: filtered });
});

monitoringRoutes.get("/geofences", (req, res) => {
  console.log("[MONITORING] GET /geofences");
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const filtered = q ? geofences.filter((geofence) => geofence.name.toLowerCase().includes(q)) : geofences;
  res.json({ ok: true, data: filtered, geofences: filtered });
});

monitoringRoutes.get("/geofences/search", (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const filtered = q ? geofences.filter((geofence) => geofence.name.toLowerCase().includes(q)) : geofences;
  res.json({ ok: true, data: filtered, geofences: filtered });
});

monitoringRoutes.get("/devices/:deviceId/status", (req, res) => {
  const device = devices.find((item) => item.id === req.params.deviceId || item.deviceId === req.params.deviceId);
  res.json({ ok: true, data: device ?? devices[0], device: device ?? devices[0] });
});

monitoringRoutes.get("/devices/:deviceId/tracking", (_req, res) => {
  res.json({ ok: true, data: tracking, tracking });
});

monitoringRoutes.get("/devices/:deviceId/trajectory", (_req, res) => {
  res.json({ ok: true, data: tracking, trajectory: tracking, tracking });
});

monitoringRoutes.get("/events", (_req, res) => {
  res.json({ ok: true, data: events, events });
});

monitoringRoutes.get("/alarms", (_req, res) => {
  res.json({ ok: true, data: alarms, alarms });
});

export default monitoringRoutes;
