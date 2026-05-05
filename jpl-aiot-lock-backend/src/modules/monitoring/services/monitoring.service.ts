import { LockConnectionStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../config/prisma";
import {
  MONITORING_ALARM_SEVERITIES,
  OPEN_MONITORING_ALERT_STATUSES,
} from "../constants/monitoring.constants";
import {
  MonitoringCompanyTreeItem,
  MonitoringCurrentUser,
  MonitoringDeviceItem,
  MonitoringDevicesQuery,
  MonitoringGeofenceItem,
  MonitoringGeofencesQuery,
  MonitoringSummaryResponse,
} from "../types/monitoring.types";

const openAlertWhere = {
  status: { in: [...OPEN_MONITORING_ALERT_STATUSES] },
  severity: { in: [...MONITORING_ALARM_SEVERITIES] },
} satisfies Prisma.AlertWhereInput;

const noCompanyAccessWhere = { companyId: "__NO_COMPANY_ACCESS__" };

type ResolvedMonitoringUser = {
  userId: string;
  role: string | null;
  companyId: string | null;
};

async function resolveCurrentUser(currentUser: MonitoringCurrentUser): Promise<ResolvedMonitoringUser> {
  const userId = currentUser.userId ?? currentUser.id;

  if (!userId) {
    throw new Error("Authenticated user not found");
  }

  if (currentUser.role !== undefined && currentUser.companyId !== undefined) {
    return {
      userId,
      role: currentUser.role,
      companyId: currentUser.companyId,
    };
  }

  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId, deletedAt: null },
    include: { role: true },
  });

  return {
    userId: user.id,
    role: user.role?.name ?? null,
    companyId: user.companyId,
  };
}

function isSuperAdminUser(user: ResolvedMonitoringUser) {
  return user.role === "SUPER_ADMIN";
}

function buildCompanyScopeWhere(
  user: ResolvedMonitoringUser,
  requestedCompanyId?: string,
): Prisma.LockWhereInput {
  if (isSuperAdminUser(user)) {
    return requestedCompanyId ? { companyId: requestedCompanyId } : {};
  }

  return user.companyId ? { companyId: user.companyId } : noCompanyAccessWhere;
}

function buildGeofenceCompanyScopeWhere(
  user: ResolvedMonitoringUser,
  requestedCompanyId?: string,
): Prisma.GeofenceWhereInput {
  if (isSuperAdminUser(user)) {
    return requestedCompanyId ? { companyId: requestedCompanyId } : {};
  }

  return user.companyId ? { companyId: user.companyId } : noCompanyAccessWhere;
}

function buildDeviceSearchWhere(search?: string): Prisma.LockWhereInput {
  if (!search) return {};

  return {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { internalCode: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { imei: { contains: search, mode: "insensitive" } },
      { macAddress: { contains: search, mode: "insensitive" } },
      { company: { name: { contains: search, mode: "insensitive" } } },
    ],
  };
}

function buildStatusFilterWhere(status?: MonitoringDevicesQuery["status"]): Prisma.LockWhereInput {
  if (!status || status === "ALL") return {};

  if (status === "ALARM") {
    return { alerts: { some: openAlertWhere } };
  }

  return { connectionStatus: status };
}

function buildDevicesWhere(
  user: ResolvedMonitoringUser,
  query: MonitoringDevicesQuery = {},
): Prisma.LockWhereInput {
  if (query.type && query.type !== "SMART_LOCK") {
    return { id: "__NO_DEVICE_TYPE_MATCH__" };
  }

  return {
    deletedAt: null,
    ...buildCompanyScopeWhere(user, query.companyId),
    ...buildStatusFilterWhere(query.status),
    ...buildDeviceSearchWhere(query.search),
  };
}

function mapDevice(lock: Prisma.LockGetPayload<{
  include: {
    company: { select: { id: true; name: true } };
    branch: { select: { id: true; name: true } };
    locations: { orderBy: { recordedAt: "desc" }; take: 1 };
    alerts: { where: typeof openAlertWhere; select: { id: true } };
  };
}>): MonitoringDeviceItem {
  const latestLocation = lock.locations[0] ?? null;
  const openAlertCount = lock.alerts.length;

  return {
    id: lock.id,
    name: lock.name,
    internalCode: lock.internalCode,
    serialNumber: lock.serialNumber,
    imei: lock.imei,
    macAddress: lock.macAddress,
    type: "SMART_LOCK",
    status: lock.status,
    connectionStatus: lock.connectionStatus,
    connectionType: lock.connectionType,
    batteryLevel: lock.batteryLevel,
    signalLevel: lock.signalLevel,
    lastConnectionAt: lock.lastConnectionAt,
    lastSyncAt: lock.lastSyncAt,
    company: lock.company ? { id: lock.company.id, name: lock.company.name } : null,
    branch: lock.branch ? { id: lock.branch.id, name: lock.branch.name } : null,
    location: latestLocation
      ? {
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          recordedAt: latestLocation.recordedAt,
        }
      : null,
    hasOpenAlert: openAlertCount > 0,
    openAlertCount,
  };
}

export async function getSummary(
  currentUser: MonitoringCurrentUser,
): Promise<MonitoringSummaryResponse> {
  const user = await resolveCurrentUser(currentUser);
  const baseWhere: Prisma.LockWhereInput = {
    deletedAt: null,
    ...buildCompanyScopeWhere(user),
  };

  const [total, online, offline, sleep, lostSignal, unknown, alarm] = await prisma.$transaction([
    prisma.lock.count({ where: baseWhere }),
    prisma.lock.count({ where: { ...baseWhere, connectionStatus: LockConnectionStatus.ONLINE } }),
    prisma.lock.count({ where: { ...baseWhere, connectionStatus: LockConnectionStatus.OFFLINE } }),
    prisma.lock.count({ where: { ...baseWhere, connectionStatus: LockConnectionStatus.SLEEP } }),
    prisma.lock.count({ where: { ...baseWhere, connectionStatus: LockConnectionStatus.LOST_SIGNAL } }),
    prisma.lock.count({ where: { ...baseWhere, connectionStatus: LockConnectionStatus.UNKNOWN } }),
    prisma.lock.count({ where: { ...baseWhere, alerts: { some: openAlertWhere } } }),
  ]);

  return { total, online, offline, sleep, lostSignal, unknown, alarm };
}

export async function getDevices(
  currentUser: MonitoringCurrentUser,
  query: MonitoringDevicesQuery,
): Promise<MonitoringDeviceItem[]> {
  const user = await resolveCurrentUser(currentUser);

  const locks = await prisma.lock.findMany({
    where: buildDevicesWhere(user, query),
    include: {
      company: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      locations: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
      alerts: {
        where: openAlertWhere,
        select: { id: true },
      },
    },
    orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
  });

  return locks.map(mapDevice);
}

export async function getGeofences(
  currentUser: MonitoringCurrentUser,
  query: MonitoringGeofencesQuery,
): Promise<MonitoringGeofenceItem[]> {
  const user = await resolveCurrentUser(currentUser);

  const geofences = await prisma.geofence.findMany({
    where: {
      ...buildGeofenceCompanyScopeWhere(user, query.companyId),
      isActive: query.active ?? true,
    },
    include: {
      company: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return geofences.map((geofence) => ({
    id: geofence.id,
    name: geofence.name,
    description: geofence.description,
    centerLat: geofence.centerLat,
    centerLng: geofence.centerLng,
    radiusMt: geofence.radiusMt,
    isActive: geofence.isActive,
    company: {
      id: geofence.company.id,
      name: geofence.company.name,
    },
  }));
}

export async function getCompaniesTree(
  currentUser: MonitoringCurrentUser,
): Promise<MonitoringCompanyTreeItem[]> {
  const user = await resolveCurrentUser(currentUser);

  const locks = await prisma.lock.findMany({
    where: {
      deletedAt: null,
      ...buildCompanyScopeWhere(user),
    },
    include: {
      company: { select: { id: true, name: true, status: true } },
      locations: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
      alerts: {
        where: openAlertWhere,
        select: { id: true },
      },
    },
    orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
  });

  const companies = new Map<string, MonitoringCompanyTreeItem>();

  for (const lock of locks) {
    const companyId = lock.company?.id ?? "unassigned";
    const company = companies.get(companyId) ?? {
      id: companyId,
      name: lock.company?.name ?? "Unassigned",
      status: lock.company?.status,
      totalDevices: 0,
      online: 0,
      offline: 0,
      sleep: 0,
      alarm: 0,
      devices: [],
    };

    company.totalDevices += 1;
    if (lock.connectionStatus === LockConnectionStatus.ONLINE) company.online += 1;
    if (lock.connectionStatus === LockConnectionStatus.OFFLINE) company.offline += 1;
    if (lock.connectionStatus === LockConnectionStatus.SLEEP) company.sleep += 1;
    if (lock.alerts.length > 0) company.alarm += 1;

    company.devices.push({
      id: lock.id,
      name: lock.name,
      internalCode: lock.internalCode,
      type: "SMART_LOCK",
      connectionStatus: lock.connectionStatus,
      batteryLevel: lock.batteryLevel,
      signalLevel: lock.signalLevel,
      hasLocation: lock.locations.length > 0,
    });

    companies.set(companyId, company);
  }

  return Array.from(companies.values());
}
