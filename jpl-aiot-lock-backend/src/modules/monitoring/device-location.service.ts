import { prisma } from "../../config/prisma";
import { demoTrajectory } from "./monitoring.service";

export async function getCurrentLocation(deviceId: string) {
  const databaseTrajectory = await getDatabaseTrajectory(deviceId);
  const latest = databaseTrajectory.at(-1) ?? demoTrajectory(deviceId).at(-1);
  if (!latest) throw new Error("Device location not found");
  return latest;
}

export async function getTrajectory(deviceId: string) {
  const databaseTrajectory = await getDatabaseTrajectory(deviceId);
  if (databaseTrajectory.length) return databaseTrajectory;

  return demoTrajectory(deviceId);
}

export async function exportTrajectory(deviceId: string) {
  const rows = await getTrajectory(deviceId);
  const header = "latitude,longitude,speed,recordedAt";
  return [header, ...rows.map((row) => `${row.latitude},${row.longitude},${row.speed},${row.recordedAt}`)].join("\n");
}

async function getDatabaseTrajectory(deviceId: string) {
  const lock = await prisma.lock.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: deviceId }, { internalCode: deviceId }],
    },
    select: { id: true },
  });

  if (!lock) return [];

  const points = await prisma.lockLocation.findMany({
    where: { lockId: lock.id },
    orderBy: { recordedAt: "asc" },
    take: 200,
  });

  return points.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
    speed: point.speed ?? 0,
    heading: point.heading ?? 0,
    reportedAt: point.recordedAt.toISOString(),
    recordedAt: point.recordedAt.toISOString(),
    battery: point.batteryLevel ?? null,
    signal: point.signalLevel ?? null,
  }));
}
