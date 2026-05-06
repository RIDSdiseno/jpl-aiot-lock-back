import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../../config/prisma";
import type { DeviceFenceQueryType, FenceSendStatus, GeoFenceInput, SendFenceInput } from "./gis.types";

let initialized = false;

async function ensureTables() {
  if (initialized) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GeoFenceCenter" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "geometryJson" JSONB NOT NULL,
      "rulesJson" JSONB NOT NULL DEFAULT '[]',
      "centerLat" DOUBLE PRECISION,
      "centerLng" DOUBLE PRECISION,
      "radiusMeters" DOUBLE PRECISION,
      "createdById" TEXT,
      "updatedById" TEXT,
      "deletedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "FenceSendRecord" (
      "id" TEXT PRIMARY KEY,
      "geoFenceId" TEXT NOT NULL,
      "deviceId" TEXT NOT NULL,
      "deviceName" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "progress" INTEGER NOT NULL DEFAULT 0,
      "polygonFenceCount" INTEGER NOT NULL DEFAULT 0,
      "circleFenceCount" INTEGER NOT NULL DEFAULT 0,
      "fenceRuleCount" INTEGER NOT NULL DEFAULT 0,
      "commandPayloadJson" JSONB,
      "responsePayloadJson" JSONB,
      "errorMessage" TEXT,
      "stoppedAt" TIMESTAMP(3),
      "sentAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "DeviceFenceReadRecord" (
      "id" TEXT PRIMARY KEY,
      "deviceId" TEXT NOT NULL,
      "queryType" TEXT NOT NULL,
      "blockNumber" INTEGER NOT NULL DEFAULT 1,
      "resultJson" JSONB,
      "status" TEXT NOT NULL,
      "errorMessage" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  initialized = true;
}

const rowFragment = Prisma.sql`
  "id", "name", "type", "status", "geometryJson", "rulesJson", "centerLat", "centerLng",
  "radiusMeters", "createdById", "updatedById", "deletedAt", "createdAt", "updatedAt"
`;

export async function listGeoFences(search?: string) {
  await ensureTables();
  const q = `%${search ?? ""}%`;
  return prisma.$queryRaw(Prisma.sql`SELECT ${rowFragment} FROM "GeoFenceCenter" WHERE "deletedAt" IS NULL AND (${search ? Prisma.sql`"name" ILIKE ${q}` : Prisma.sql`TRUE`}) ORDER BY "createdAt" DESC`);
}

export async function getGeoFence(id: string) {
  await ensureTables();
  const rows = await prisma.$queryRaw<object[]>(Prisma.sql`SELECT ${rowFragment} FROM "GeoFenceCenter" WHERE "id" = ${id} AND "deletedAt" IS NULL LIMIT 1`);
  return rows[0] ?? null;
}

export async function createGeoFence(data: GeoFenceInput, userId?: string) {
  await ensureTables();
  const id = randomUUID();
  const center = data.geometry.center ?? data.geometry.points?.[0];
  const geometry = data.geometry as unknown as Prisma.InputJsonValue;
  const rules = data.rules as unknown as Prisma.InputJsonValue;
  const rows = await prisma.$queryRaw<object[]>(Prisma.sql`
    INSERT INTO "GeoFenceCenter" ("id", "name", "type", "status", "geometryJson", "rulesJson", "centerLat", "centerLng", "radiusMeters", "createdById", "updatedById")
    VALUES (${id}, ${data.name}, ${data.type}, ${data.status ?? "ACTIVE"}, ${geometry}, ${rules}, ${center?.lat ?? null}, ${center?.lng ?? null}, ${data.geometry.radiusMeters ?? null}, ${userId ?? null}, ${userId ?? null})
    RETURNING ${rowFragment}
  `);
  return rows[0];
}

export async function updateGeoFence(id: string, data: Partial<GeoFenceInput>, userId?: string) {
  await ensureTables();
  const current = await getGeoFence(id);
  if (!current) return null;
  const currentRecord = current as { name: string; type: string; status: string; geometryJson: object; rulesJson: object[] };
  const next = {
    name: data.name ?? currentRecord.name,
    type: data.type ?? currentRecord.type,
    status: data.status ?? currentRecord.status,
    geometry: (data.geometry ?? currentRecord.geometryJson) as Prisma.InputJsonValue,
    rules: (data.rules ?? currentRecord.rulesJson) as Prisma.InputJsonValue,
  };
  const geometry = data.geometry ?? (currentRecord.geometryJson as { center?: { lat: number; lng: number }; points?: Array<{ lat: number; lng: number }>; radiusMeters?: number });
  const center = geometry.center ?? geometry.points?.[0];
  const rows = await prisma.$queryRaw<object[]>(Prisma.sql`
    UPDATE "GeoFenceCenter"
    SET "name" = ${next.name}, "type" = ${next.type}, "status" = ${next.status}, "geometryJson" = ${next.geometry}, "rulesJson" = ${next.rules},
        "centerLat" = ${center?.lat ?? null}, "centerLng" = ${center?.lng ?? null}, "radiusMeters" = ${geometry.radiusMeters ?? null}, "updatedById" = ${userId ?? null}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id} AND "deletedAt" IS NULL
    RETURNING ${rowFragment}
  `);
  return rows[0] ?? null;
}

export async function softDeleteGeoFence(id: string) {
  await ensureTables();
  await prisma.$executeRaw(Prisma.sql`UPDATE "GeoFenceCenter" SET "deletedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${id}`);
}

export async function batchDeleteGeoFences(ids: string[]) {
  await ensureTables();
  await prisma.$executeRaw(Prisma.sql`UPDATE "GeoFenceCenter" SET "deletedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" IN (${Prisma.join(ids)})`);
}

export async function createSendRecords(input: SendFenceInput) {
  await ensureTables();
  const fences = (await prisma.$queryRaw<Array<{ id: string; type: string; rulesJson: object[] }>>(Prisma.sql`SELECT "id", "type", "rulesJson" FROM "GeoFenceCenter" WHERE "id" IN (${Prisma.join(input.geoFenceIds)}) AND "deletedAt" IS NULL`));
  const rows: object[] = [];
  for (const fence of fences) {
    for (const device of input.devices) {
      const id = randomUUID();
      const offline = (device.status ?? "").toUpperCase() === "OFFLINE";
      const status: FenceSendStatus = offline ? "PENDING" : "SENT";
      const progress = offline ? 0 : 100;
      const created = await prisma.$queryRaw<object[]>(Prisma.sql`
        INSERT INTO "FenceSendRecord" ("id", "geoFenceId", "deviceId", "deviceName", "status", "progress", "polygonFenceCount", "circleFenceCount", "fenceRuleCount", "commandPayloadJson", "sentAt")
        VALUES (${id}, ${fence.id}, ${device.deviceId}, ${device.deviceName ?? null}, ${status}, ${progress}, ${fence.type === "POLYGON" ? 1 : 0}, ${fence.type === "CIRCLE" ? 1 : 0}, ${fence.rulesJson.length}, ${input as unknown as Prisma.InputJsonValue}, ${offline ? null : new Date()})
        RETURNING *
      `);
      rows.push(created[0]);
    }
  }
  return rows;
}

export async function listSendRecords(filters: { deviceId?: string; deviceName?: string; status?: string; startDate?: string; endDate?: string }) {
  await ensureTables();
  return prisma.$queryRaw(Prisma.sql`
    SELECT * FROM "FenceSendRecord"
    WHERE (${filters.deviceId ? Prisma.sql`"deviceId" ILIKE ${`%${filters.deviceId}%`}` : Prisma.sql`TRUE`})
      AND (${filters.deviceName ? Prisma.sql`"deviceName" ILIKE ${`%${filters.deviceName}%`}` : Prisma.sql`TRUE`})
      AND (${filters.status ? Prisma.sql`"status" = ${filters.status}` : Prisma.sql`TRUE`})
      AND (${filters.startDate ? Prisma.sql`"createdAt" >= ${new Date(filters.startDate)}` : Prisma.sql`TRUE`})
      AND (${filters.endDate ? Prisma.sql`"createdAt" <= ${new Date(filters.endDate)}` : Prisma.sql`TRUE`})
    ORDER BY "createdAt" DESC
  `);
}

export async function updateSendRecordStatus(id: string, status: FenceSendStatus) {
  await ensureTables();
  const progress = status === "SENT" ? 100 : status === "STOPPED" ? 0 : 10;
  const rows = await prisma.$queryRaw<object[]>(Prisma.sql`
    UPDATE "FenceSendRecord" SET "status" = ${status}, "progress" = ${progress}, "updatedAt" = CURRENT_TIMESTAMP,
      "stoppedAt" = ${status === "STOPPED" ? new Date() : null}, "sentAt" = ${status === "SENT" ? new Date() : null}
    WHERE "id" = ${id} RETURNING *
  `);
  return rows[0] ?? null;
}

export async function deleteSendRecord(id: string) {
  await ensureTables();
  await prisma.$executeRaw(Prisma.sql`DELETE FROM "FenceSendRecord" WHERE "id" = ${id}`);
}

export async function batchDeleteSendRecords(ids: string[]) {
  await ensureTables();
  await prisma.$executeRaw(Prisma.sql`DELETE FROM "FenceSendRecord" WHERE "id" IN (${Prisma.join(ids)})`);
}

export async function readDeviceFences(deviceId: string, queryType: DeviceFenceQueryType, blockNumber: number) {
  await ensureTables();
  const result = { queryType, blockNumber, readAt: new Date().toISOString(), fences: await listGeoFences() };
  const rows = await prisma.$queryRaw<object[]>(Prisma.sql`
    INSERT INTO "DeviceFenceReadRecord" ("id", "deviceId", "queryType", "blockNumber", "resultJson", "status")
    VALUES (${randomUUID()}, ${deviceId}, ${queryType}, ${blockNumber}, ${result as unknown as Prisma.InputJsonValue}, 'COMPLETED')
    RETURNING *
  `);
  return rows[0];
}
