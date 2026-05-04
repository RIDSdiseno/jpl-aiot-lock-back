import { LockEventType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { CreateLocationInput } from "./gps.schemas";

export function getLatestLocation(lockId: string) {
  return prisma.lockLocation.findFirst({
    where: { lockId },
    orderBy: { recordedAt: "desc" },
  });
}

export function getLocationHistory(lockId: string) {
  return prisma.lockLocation.findMany({
    where: { lockId },
    orderBy: { recordedAt: "desc" },
    take: 500,
  });
}

export async function createLocation(lockId: string, data: CreateLocationInput) {
  await prisma.lock.findFirstOrThrow({ where: { id: lockId, deletedAt: null } });

  const location = await prisma.lockLocation.create({
    data: {
      lockId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      speed: data.speed,
      heading: data.heading,
      batteryLevel: data.batteryLevel,
      signalLevel: data.signalLevel,
      source: data.source ?? "iot",
      rawPayload: data.rawPayload === undefined ? undefined : JSON.parse(JSON.stringify(data.rawPayload)),
      recordedAt: data.recordedAt,
    },
  });

  await prisma.lockEvent.create({
    data: {
      lockId,
      type: LockEventType.GPS_UPDATED,
      latitude: data.latitude,
      longitude: data.longitude,
      batteryLevel: data.batteryLevel,
      signalLevel: data.signalLevel,
      rawPayload: data.rawPayload === undefined ? undefined : JSON.parse(JSON.stringify(data.rawPayload)),
    },
  });

  return location;
}
