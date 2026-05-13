import { prisma } from "../../config/prisma";
import { eventRepository } from "../events/event.repository";
import type { DeviceEventItem } from "../events/events.types";
import type { ReportQueryParams } from "./report.types";

export const reportRepository = {
  async listLockUnlockEvents(params: ReportQueryParams): Promise<DeviceEventItem[]> {
    const databaseEvents = await readDeviceEvents(params);
    if (databaseEvents.length > 0) return databaseEvents;
    return controlledLockUnlockMock();
  },

  async findLockUnlockEventById(id: string): Promise<DeviceEventItem | undefined> {
    const databaseEvent = await readDeviceEventById(id);
    if (databaseEvent) return databaseEvent;
    return controlledLockUnlockMock().find((event) => event.id === id) ?? eventRepository.findEventById(id) as DeviceEventItem | undefined;
  },
};

async function readDeviceEvents(params: ReportQueryParams): Promise<DeviceEventItem[]> {
  try {
    const rows = await prisma.$queryRawUnsafe<DatabaseDeviceEventRow[]>(
      `
      SELECT
        id,
        "deviceId",
        "deviceName",
        "productModel",
        "gpsTime",
        "eventName",
        "eventType",
        "dataType",
        latitude,
        longitude,
        "eventImageUrl",
        description,
        "operatingInfo",
        source,
        "rawPayload",
        "createdAt"
      FROM "DeviceEvent"
      WHERE ($1::text IS NULL OR "productModel" ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR "deviceId" ILIKE '%' || $2 || '%')
        AND ("gpsTime" IS NULL OR "gpsTime" BETWEEN $3::timestamp AND $4::timestamp)
      ORDER BY "gpsTime" ${params.sortOrder === "ASC" ? "ASC" : "DESC"} NULLS LAST
      LIMIT 500
      `,
      params.productModel ?? null,
      params.deviceId ?? null,
      params.startDate,
      params.endDate,
    );

    return rows.map((row) => ({
      id: row.id,
      deviceId: row.deviceId,
      deviceName: row.deviceName ?? undefined,
      productModel: row.productModel ?? undefined,
      gpsTime: row.gpsTime?.toISOString(),
      eventName: row.eventName ?? undefined,
      events: row.eventName ?? undefined,
      eventType: row.eventType,
      dataType: row.dataType ?? undefined,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      eventImageUrl: row.eventImageUrl,
      description: row.description ?? undefined,
      operatingInfo: row.operatingInfo ?? undefined,
      source: row.source ?? undefined,
      rawPayload: row.rawPayload,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (error) {
    console.warn("[REPORT][LOCK_UNLOCK_LIST] database unavailable, using controlled mock", { message: error instanceof Error ? error.message : "unknown" });
    return [];
  }
}

async function readDeviceEventById(id: string): Promise<DeviceEventItem | undefined> {
  try {
    const [row] = await prisma.$queryRawUnsafe<DatabaseDeviceEventRow[]>(
      `
      SELECT
        id,
        "deviceId",
        "deviceName",
        "productModel",
        "gpsTime",
        "eventName",
        "eventType",
        "dataType",
        latitude,
        longitude,
        "eventImageUrl",
        description,
        "operatingInfo",
        source,
        "rawPayload",
        "createdAt"
      FROM "DeviceEvent"
      WHERE id = $1
      LIMIT 1
      `,
      id,
    );
    if (!row) return undefined;
    return {
      id: row.id,
      deviceId: row.deviceId,
      deviceName: row.deviceName ?? undefined,
      productModel: row.productModel ?? undefined,
      gpsTime: row.gpsTime?.toISOString(),
      eventName: row.eventName ?? undefined,
      events: row.eventName ?? undefined,
      eventType: row.eventType,
      dataType: row.dataType ?? undefined,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      eventImageUrl: row.eventImageUrl,
      description: row.description ?? undefined,
      operatingInfo: row.operatingInfo ?? undefined,
      source: row.source ?? undefined,
      rawPayload: row.rawPayload,
      createdAt: row.createdAt.toISOString(),
    };
  } catch {
    return undefined;
  }
}

interface DatabaseDeviceEventRow {
  id: string;
  deviceId: string;
  deviceName: string | null;
  productModel: string | null;
  gpsTime: Date | null;
  eventName: string | null;
  eventType: string;
  dataType: string | null;
  latitude: number | null;
  longitude: number | null;
  eventImageUrl: string | null;
  description: string | null;
  operatingInfo: string | null;
  source: string | null;
  rawPayload: unknown;
  createdAt: Date;
}

function controlledLockUnlockMock(): DeviceEventItem[] {
  const baseTime = Date.UTC(2026, 4, 13, 9, 15, 0);
  const seeds = [
    ["lock_001", "553071208561", "G300N24CL10385", "UNLOCK", "BLE unlock success", "Real-time", -23.624895, -70.390415],
    ["lock_002", "708049716330", "G300N24CL10176", "LOCK", "Remote lock success", "Command response", -23.624892, -70.390408],
    ["lock_003", "708049716223", "G300N24CL10173", "SEAL", "APP seal success", "Historical", -23.624894, -70.390414],
    ["lock_004", "553071208470", "G300N24CL10386", "ILLEGAL_UNLOCK", "Illegal unlock alarm", "Alarm", -23.624895, -70.390415],
    ["lock_005", "553071201160", "G300N24CL10294", "UNSEAL", "BLE-unsealing success", "Real-time", -23.624892, -70.390408],
  ] as const;

  return seeds.map(([id, deviceId, deviceName, eventType, operatingInfo, dataType, latitude, longitude], index) => ({
    id,
    sortNo: index + 1,
    deviceId,
    deviceName,
    productModel: "G300N",
    gpsTime: new Date(baseTime - index * 3 * 60 * 60 * 1000).toISOString(),
    eventName: operatingInfo,
    events: operatingInfo,
    eventType,
    lockStatus: eventType === "LOCK" || eventType === "SEAL" ? "LOCKED" : "UNLOCKED",
    dataType,
    latitude,
    longitude,
    eventImageUrl: null,
    description: `${operatingInfo} for ${deviceName}`,
    operatingInfo,
    source: operatingInfo.toLowerCase().includes("ble") ? "BLE" : operatingInfo.toLowerCase().includes("app") ? "APP" : "DEVICE",
    severity: eventType === "ILLEGAL_UNLOCK" ? "HIGH" : "INFO",
    rawPayload: { provider: "HHDLink", mock: true, eventType, sequence: index + 1 },
    createdAt: new Date(baseTime - index * 3 * 60 * 60 * 1000).toISOString(),
  }));
}
