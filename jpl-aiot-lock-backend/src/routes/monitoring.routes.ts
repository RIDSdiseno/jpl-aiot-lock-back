import { Router } from "express";

export const monitoringRoutes = Router();

const iso = (minutesAgo = 0) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

const company = { companyId: "demo", companyName: "DEMO" };

const devices = [
  {
    id: "1",
    deviceId: "198065617508",
    name: "198065617508(Test)",
    ...company,
    model: "Smart Lock",
    type: "SMART_LOCK",
    status: "ONLINE",
    isOnline: true,
    hasActiveAlarm: false,
    alarmType: null,
    latitude: 22.68808,
    longitude: 113.797646,
    lockStatus: "Seal + Shackle closed",
    batteryLevel: 100,
    signalLevel: 80,
    lastConnectionAt: "2024-01-31T10:47:55.000Z",
    lastPositioningAt: "2024-01-31T10:47:55.000Z",
  },
  {
    id: "2",
    deviceId: "198065617509",
    name: "198065617509",
    ...company,
    model: "Smart Lock",
    type: "SMART_LOCK",
    status: "OFFLINE",
    isOnline: false,
    hasActiveAlarm: false,
    alarmType: null,
    latitude: 22.6845,
    longitude: 113.7898,
    lockStatus: "Seal + Shackle closed",
    batteryLevel: 76,
    signalLevel: 0,
    lastConnectionAt: iso(1440),
    lastPositioningAt: iso(1440),
  },
  {
    id: "3",
    deviceId: "198065617510",
    name: "198065617510",
    ...company,
    model: "Smart Lock",
    type: "SMART_LOCK",
    status: "OFFLINE",
    isOnline: false,
    hasActiveAlarm: false,
    alarmType: null,
    latitude: 22.6912,
    longitude: 113.8032,
    lockStatus: "Seal + Shackle closed",
    batteryLevel: 61,
    signalLevel: 0,
    lastConnectionAt: iso(1320),
    lastPositioningAt: iso(1320),
  },
  {
    id: "4",
    deviceId: "198065617511",
    name: "198065617511",
    ...company,
    model: "Smart Lock",
    type: "SMART_LOCK",
    status: "OFFLINE",
    isOnline: false,
    hasActiveAlarm: false,
    alarmType: null,
    latitude: 22.6765,
    longitude: 113.8101,
    lockStatus: "Seal + Shackle closed",
    batteryLevel: 45,
    signalLevel: 0,
    lastConnectionAt: iso(950),
    lastPositioningAt: iso(950),
  },
  {
    id: "5",
    deviceId: "198065617512",
    name: "198065617512",
    ...company,
    model: "Smart Lock",
    type: "SMART_LOCK",
    status: "OFFLINE",
    isOnline: false,
    hasActiveAlarm: false,
    alarmType: null,
    latitude: 22.6998,
    longitude: 113.7922,
    lockStatus: "Seal + Shackle closed",
    batteryLevel: 33,
    signalLevel: 0,
    lastConnectionAt: iso(820),
    lastPositioningAt: iso(820),
  },
  {
    id: "6",
    deviceId: "198065617513",
    name: "198065617513 Alarm Demo",
    ...company,
    model: "Smart Lock",
    type: "SMART_LOCK",
    status: "ALARM",
    isOnline: false,
    hasActiveAlarm: true,
    alarmType: "TAMPER_ALARM",
    latitude: 22.704,
    longitude: 113.805,
    lockStatus: "Seal + Shackle closed",
    batteryLevel: 29,
    signalLevel: 20,
    lastConnectionAt: iso(25),
    lastPositioningAt: iso(25),
  },
];

const geofences = [
  {
    id: "demo-fence",
    name: "Demo Fence",
    companyId: "demo",
    companyName: "DEMO",
    shapeType: "CIRCLE",
    centerLat: 22.68808,
    centerLng: 113.797646,
    radiusMeters: 1200,
    coordinates: [],
    status: "ACTIVE",
    type: "circle",
    radiusMt: 1200,
    isActive: true,
  },
];

const trajectory = Array.from({ length: 8 }, (_, index) => ({
  latitude: 22.68808 + (index - 3) * 0.001,
  longitude: 113.797646 + (index - 3) * 0.0012,
  speed: index % 2 ? 9 : 0,
  recordedAt: iso((8 - index) * 5),
}));

function groupDevices(filteredDevices: typeof devices) {
  return Object.values(
    filteredDevices.reduce<Record<string, { companyId: string; companyName: string; devices: typeof devices }>>((acc, device) => {
      acc[device.companyId] ??= { companyId: device.companyId, companyName: device.companyName, devices: [] };
      acc[device.companyId].devices.push(device);
      return acc;
    }, {}),
  );
}

function filterDevices(status?: unknown, q?: unknown) {
  const normalizedStatus = String(status ?? "all").toUpperCase();
  const text = String(q ?? "").trim().toLowerCase();
  return devices.filter((device) => {
    const matchesStatus = normalizedStatus === "ALL" || device.status === normalizedStatus;
    const matchesText =
      !text ||
      device.name.toLowerCase().includes(text) ||
      device.deviceId.toLowerCase().includes(text) ||
      device.companyName.toLowerCase().includes(text);
    return matchesStatus && matchesText;
  });
}

monitoringRoutes.get("/devices", (req, res) => {
  const filtered = filterDevices(req.query.status, req.query.q);
  res.json({ ok: true, data: groupDevices(filtered), devices: filtered });
});

monitoringRoutes.get("/devices/search", (req, res) => {
  const filtered = filterDevices("all", req.query.q);
  res.json({ ok: true, data: groupDevices(filtered), devices: filtered });
});

monitoringRoutes.get("/companies/:companyId/devices", (req, res) => {
  const filtered = filterDevices(req.query.status, req.query.q).filter((device) => device.companyId === req.params.companyId);
  res.json({ ok: true, data: groupDevices(filtered), devices: filtered });
});

monitoringRoutes.get("/devices/:deviceId/status", (req, res) => {
  const device = devices.find((item) => item.id === req.params.deviceId || item.deviceId === req.params.deviceId) ?? devices[0];
  res.json({ ok: true, data: device, device });
});

monitoringRoutes.get("/devices/:deviceId/location/current", (req, res) => {
  const device = devices.find((item) => item.id === req.params.deviceId || item.deviceId === req.params.deviceId) ?? devices[0];
  res.json({
    ok: true,
    data: {
      deviceId: device.deviceId,
      latitude: device.latitude,
      longitude: device.longitude,
      recordedAt: device.lastPositioningAt,
    },
    location: {
      deviceId: device.deviceId,
      latitude: device.latitude,
      longitude: device.longitude,
      recordedAt: device.lastPositioningAt,
    },
  });
});

monitoringRoutes.get("/devices/:deviceId/tracking", (_req, res) => {
  res.json({ ok: true, data: trajectory, tracking: trajectory });
});

monitoringRoutes.get("/devices/:deviceId/trajectory", (_req, res) => {
  res.json({ ok: true, data: trajectory, trajectory, tracking: trajectory });
});

monitoringRoutes.get("/geofences", (req, res) => {
  const text = String(req.query.q ?? "").trim().toLowerCase();
  const filtered = text ? geofences.filter((fence) => fence.name.toLowerCase().includes(text)) : geofences;
  res.json({ ok: true, data: filtered, geofences: filtered });
});

monitoringRoutes.get("/geofences/search", (req, res) => {
  const text = String(req.query.q ?? "").trim().toLowerCase();
  const filtered = text ? geofences.filter((fence) => fence.name.toLowerCase().includes(text)) : geofences;
  res.json({ ok: true, data: filtered, geofences: filtered });
});

export default monitoringRoutes;
