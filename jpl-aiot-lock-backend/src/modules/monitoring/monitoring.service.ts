import { LockConnectionStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import * as legacyMonitoringService from "./services/monitoring.service";
import { mapLegacyDevice, mapLegacyGeofence, normalizeStatus } from "./monitoring.mapper";
import type {
  MonitoringCurrentUser,
  MonitoringDevice,
  MonitoringGeoFence,
  MonitoringStatusFilter,
  MonitoringTrajectoryPoint,
} from "./monitoring.types";

const now = new Date();

export const mockDevices: MonitoringDevice[] = [
  {
    id: "demo-lock-001",
    deviceId: "JPL-DEMO-001",
    name: "Candado DEMO Norte",
    companyId: "demo-company",
    companyName: "DEMO",
    status: "online",
    connectionStatus: LockConnectionStatus.ONLINE,
    battery: 92,
    signal: 88,
    latitude: -33.4372,
    longitude: -70.6506,
    connectionMode: "LTE",
    deviceStatus: "Active",
    speed: 0,
    sim: "895607000000001",
    lockStatus: "sealed",
    shackleStatus: "closed",
    alarmStatus: "Normal",
    events: ["GPS updated", "Seal confirmed"],
    positioningTime: new Date(now.getTime() - 3 * 60_000).toISOString(),
    location: "Providencia, Santiago",
    lastSeenAt: new Date(now.getTime() - 2 * 60_000).toISOString(),
  },
  {
    id: "demo-lock-002",
    deviceId: "JPL-DEMO-002",
    name: "Candado DEMO Centro",
    companyId: "demo-company",
    companyName: "DEMO",
    status: "alarm",
    connectionStatus: LockConnectionStatus.ONLINE,
    battery: 67,
    signal: 71,
    latitude: -33.4489,
    longitude: -70.6693,
    connectionMode: "NB-IoT",
    deviceStatus: "Active",
    speed: 12,
    sim: "895607000000002",
    lockStatus: "sealed",
    shackleStatus: "closed",
    alarmStatus: "Fence exit alarm",
    events: ["Geofence exit", "Vibration alarm"],
    positioningTime: new Date(now.getTime() - 5 * 60_000).toISOString(),
    location: "Centro, Santiago",
    lastSeenAt: new Date(now.getTime() - 4 * 60_000).toISOString(),
  },
  {
    id: "demo-lock-003",
    deviceId: "JPL-DEMO-003",
    name: "Candado DEMO Ruta 68",
    companyId: "demo-company",
    companyName: "DEMO",
    status: "offline",
    connectionStatus: LockConnectionStatus.OFFLINE,
    battery: 41,
    signal: 0,
    latitude: -33.4548,
    longitude: -70.7304,
    connectionMode: "LTE",
    deviceStatus: "Sleep",
    speed: 0,
    sim: "895607000000003",
    lockStatus: "sealed",
    shackleStatus: "closed",
    alarmStatus: "Normal",
    events: ["Last heartbeat missed"],
    positioningTime: new Date(now.getTime() - 73 * 60_000).toISOString(),
    location: "Pudahuel, Santiago",
    lastSeenAt: new Date(now.getTime() - 70 * 60_000).toISOString(),
  },
  {
    id: "demo-lock-004",
    deviceId: "JPL-DEMO-004",
    name: "Candado DEMO Maipu",
    companyId: "demo-company",
    companyName: "DEMO",
    status: "online",
    connectionStatus: LockConnectionStatus.ONLINE,
    battery: 78,
    signal: 82,
    latitude: -33.5102,
    longitude: -70.7564,
    connectionMode: "LTE",
    deviceStatus: "Moving",
    speed: 34,
    sim: "895607000000004",
    lockStatus: "sealed",
    shackleStatus: "closed",
    alarmStatus: "Normal",
    events: ["Moving", "GPS updated"],
    positioningTime: new Date(now.getTime() - 7 * 60_000).toISOString(),
    location: "Maipu, Santiago",
    lastSeenAt: new Date(now.getTime() - 6 * 60_000).toISOString(),
  },
  {
    id: "demo-lock-005",
    deviceId: "JPL-DEMO-005",
    name: "Candado DEMO Quilicura",
    companyId: "demo-company",
    companyName: "DEMO",
    status: "offline",
    connectionStatus: LockConnectionStatus.OFFLINE,
    battery: 25,
    signal: 0,
    latitude: -33.3571,
    longitude: -70.7293,
    connectionMode: "NB-IoT",
    deviceStatus: "Offline",
    speed: 0,
    sim: "895607000000005",
    lockStatus: "sealed",
    shackleStatus: "closed",
    alarmStatus: "Low battery",
    events: ["Low battery", "Offline"],
    positioningTime: new Date(now.getTime() - 132 * 60_000).toISOString(),
    location: "Quilicura, Santiago",
    lastSeenAt: new Date(now.getTime() - 130 * 60_000).toISOString(),
  },
  {
    id: "demo-lock-006",
    deviceId: "JPL-DEMO-006",
    name: "Candado DEMO San Bernardo",
    companyId: "demo-company",
    companyName: "DEMO",
    status: "alarm",
    connectionStatus: LockConnectionStatus.ONLINE,
    battery: 84,
    signal: 76,
    latitude: -33.5922,
    longitude: -70.6996,
    connectionMode: "LTE",
    deviceStatus: "Active",
    speed: 4,
    sim: "895607000000006",
    lockStatus: "unsealed",
    shackleStatus: "open",
    alarmStatus: "Illegal unseal",
    events: ["Illegal unseal", "Shackle open"],
    positioningTime: new Date(now.getTime() - 9 * 60_000).toISOString(),
    location: "San Bernardo, Santiago",
    lastSeenAt: new Date(now.getTime() - 8 * 60_000).toISOString(),
  },
];

export const mockGeofences: MonitoringGeoFence[] = [
  {
    id: "demo-fence-001",
    name: "Geocerca DEMO Santiago",
    companyId: "demo-company",
    companyName: "DEMO",
    type: "circle",
    centerLat: -33.4489,
    centerLng: -70.6693,
    radiusMt: 8500,
    isActive: true,
  },
];

function filterDevices(devices: MonitoringDevice[], status?: string, q?: string) {
  const normalized = normalizeStatus(status);
  const text = q?.trim().toLowerCase();

  return devices.filter((device) => {
    const matchesStatus = normalized === "all" || device.status === normalized;
    const matchesText =
      !text ||
      device.name.toLowerCase().includes(text) ||
      device.deviceId.toLowerCase().includes(text) ||
      device.companyName.toLowerCase().includes(text);
    return matchesStatus && matchesText;
  });
}

async function getLegacyDevices(currentUser: MonitoringCurrentUser, status?: MonitoringStatusFilter, q?: string) {
  const legacyStatus = status === "online" ? "ONLINE" : status === "offline" ? "OFFLINE" : status === "alarm" ? "ALARM" : undefined;
  const devices = await legacyMonitoringService.getDevices(currentUser, {
    status: legacyStatus,
    search: q,
  });
  return devices.map(mapLegacyDevice).filter((device): device is MonitoringDevice => Boolean(device));
}

function mapLockToMonitoringDevice(lock: Awaited<ReturnType<typeof findLockWithLatestLocation>>): MonitoringDevice | null {
  if (!lock) return null;

  const latestLocation = lock.locations[0];
  if (!latestLocation || !lock.company) return null;

  const hasOpenAlert = lock.alerts.length > 0;
  const hasCriticalOperationalAlert = lock.alerts.some((alert) =>
    ["CUT_ALARM", "DEMOLITION_ALARM", "GEOFENCE_EXIT"].includes(alert.title),
  );
  const status =
    lock.connectionStatus === "OFFLINE"
      ? "offline"
      : hasCriticalOperationalAlert
        ? "alarm"
        : lock.connectionStatus === "ONLINE"
          ? "online"
          : "offline";

  return {
    id: lock.id,
    deviceId: lock.internalCode,
    name: lock.name,
    companyId: lock.company.id,
    companyName: lock.company.name,
    status,
    connectionStatus: lock.connectionStatus,
    battery: lock.batteryLevel ?? latestLocation.batteryLevel ?? 0,
    signal: lock.signalLevel ?? latestLocation.signalLevel ?? 0,
    latitude: latestLocation.latitude,
    longitude: latestLocation.longitude,
    connectionMode: lock.connectionType,
    deviceStatus: lock.status,
    speed: latestLocation.speed ?? 0,
    sim: lock.imei ?? "N/A",
    lockStatus: lock.status === "UNLOCKED" ? "unsealed" : "sealed",
    shackleStatus: lock.status === "UNLOCKED" ? "open" : "closed",
    alarmStatus: hasOpenAlert ? `${lock.alerts.length} active alarm(s)` : "Normal",
    events: hasOpenAlert ? lock.alerts.map((alert) => alert.title) : ["Status synchronized"],
    positioningTime: latestLocation.recordedAt.toISOString(),
    location: `${latestLocation.latitude.toFixed(6)}, ${latestLocation.longitude.toFixed(6)}`,
    lastSeenAt: (lock.lastConnectionAt ?? latestLocation.recordedAt).toISOString(),
  };
}

async function findLockWithLatestLocation(deviceId: string) {
  return prisma.lock.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: deviceId }, { internalCode: deviceId }],
    },
    include: {
      company: { select: { id: true, name: true } },
      locations: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
      alerts: {
        where: {
          status: { in: ["OPEN", "ACKNOWLEDGED"] },
          severity: { in: ["WARNING", "CRITICAL"] },
        },
        select: { title: true },
      },
    },
  });
}

async function getDatabaseDevices(status?: string, q?: string) {
  const normalized = normalizeStatus(status);
  const text = q?.trim();
  const locks = await prisma.lock.findMany({
    where: {
      deletedAt: null,
      company: { rut: "JPL-DEMO" },
      ...(text
        ? {
            OR: [
              { name: { contains: text, mode: "insensitive" as const } },
              { internalCode: { contains: text, mode: "insensitive" as const } },
              { company: { name: { contains: text, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: {
      company: { select: { id: true, name: true } },
      locations: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
      alerts: {
        where: {
          status: { in: ["OPEN", "ACKNOWLEDGED"] },
          severity: { in: ["WARNING", "CRITICAL"] },
        },
        select: { title: true },
      },
    },
    orderBy: { internalCode: "asc" },
  });

  return locks
    .map(mapLockToMonitoringDevice)
    .filter((device): device is MonitoringDevice => Boolean(device))
    .filter((device) => normalized === "all" || device.status === normalized);
}

export async function getDevices(currentUser: MonitoringCurrentUser, status?: string, q?: string) {
  if (!currentUser.id && !currentUser.userId) {
    const databaseDevices = await getDatabaseDevices(status, q);
    if (databaseDevices.length) return databaseDevices;
  }

  try {
    const devices = await getLegacyDevices(currentUser, normalizeStatus(status), q);
    if (devices.length) return devices;
  } catch {
    // Fall through to mock data while the provider/API database is not fully wired.
  }
  return filterDevices(mockDevices, status, q);
}

export async function searchDevices(currentUser: MonitoringCurrentUser, q?: string) {
  return getDevices(currentUser, undefined, q);
}

export async function getDeviceById(deviceId: string) {
  const databaseDevice = mapLockToMonitoringDevice(await findLockWithLatestLocation(deviceId));
  if (databaseDevice) return databaseDevice;

  const device = mockDevices.find((item) => item.id === deviceId || item.deviceId === deviceId);
  if (!device) throw new Error("Device not found");
  return device;
}

export async function getGeofences(currentUser: MonitoringCurrentUser, q?: string) {
  if (!currentUser.id && !currentUser.userId) {
    const text = q?.trim();
    const geofences = await prisma.geofence.findMany({
      where: {
        company: { rut: "JPL-DEMO" },
        isActive: true,
        ...(text ? { name: { contains: text, mode: "insensitive" as const } } : {}),
      },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });

    if (geofences.length) return geofences.map(mapLegacyGeofence);
  }

  try {
    const geofences = await legacyMonitoringService.getGeofences(currentUser, {});
    const mapped = geofences.map(mapLegacyGeofence);
    if (mapped.length) {
      const text = q?.toLowerCase();
      return text ? mapped.filter((fence) => fence.name.toLowerCase().includes(text)) : mapped;
    }
  } catch {
    // Fall through to mock data.
  }

  const text = q?.toLowerCase();
  return text ? mockGeofences.filter((fence) => fence.name.toLowerCase().includes(text)) : mockGeofences;
}

export async function getDeviceGeofences(currentUser: MonitoringCurrentUser, deviceId: string) {
  await getDeviceById(deviceId);
  return getGeofences(currentUser);
}

export async function syncDeviceGeofence(currentUser: MonitoringCurrentUser, deviceId: string, geofenceId: string) {
  await getDeviceById(deviceId);
  const geofence = (await getGeofences(currentUser)).find((item) => item.id === geofenceId);
  if (!geofence) throw new Error("Geofence not found");
  return { deviceId, geofenceId, syncedAt: new Date().toISOString() };
}

export function demoTrajectory(deviceId: string): MonitoringTrajectoryPoint[] {
  const device = mockDevices.find((item) => item.id === deviceId || item.deviceId === deviceId) ?? mockDevices[0];
  return Array.from({ length: 12 }, (_, index) => ({
    latitude: device.latitude + (index - 6) * 0.0025,
    longitude: device.longitude + (index - 6) * 0.002,
    speed: Math.max(0, device.speed + index - 5),
    recordedAt: new Date(Date.now() - (12 - index) * 5 * 60_000).toISOString(),
  }));
}

export async function ensureDemoData() {
  const role = await prisma.role.findFirst({ where: { name: "SUPER_ADMIN" } });
  const company = await prisma.company.upsert({
    where: { id: "demo-company" },
    update: { name: "DEMO", status: "ACTIVE" },
    create: { id: "demo-company", name: "DEMO", status: "ACTIVE" },
  });

  if (role) {
    await prisma.user.updateMany({
      where: { email: "JPL", companyId: null },
      data: { roleId: role.id },
    });
  }

  for (const device of mockDevices) {
    await prisma.lock.upsert({
      where: { internalCode: device.deviceId },
      update: {
        name: device.name,
        companyId: company.id,
        connectionStatus: device.connectionStatus,
        batteryLevel: device.battery,
        signalLevel: device.signal,
        lastConnectionAt: new Date(device.lastSeenAt),
      },
      create: {
        name: device.name,
        internalCode: device.deviceId,
        imei: device.sim,
        companyId: company.id,
        connectionType: "LTE",
        connectionStatus: device.connectionStatus,
        batteryLevel: device.battery,
        signalLevel: device.signal,
        lastConnectionAt: new Date(device.lastSeenAt),
      },
    });
  }

  await prisma.geofence.upsert({
    where: { id: mockGeofences[0].id },
    update: {},
    create: {
      id: mockGeofences[0].id,
      name: mockGeofences[0].name,
      companyId: company.id,
      centerLat: mockGeofences[0].centerLat,
      centerLng: mockGeofences[0].centerLng,
      radiusMt: mockGeofences[0].radiusMt,
      isActive: true,
    },
  });
}
