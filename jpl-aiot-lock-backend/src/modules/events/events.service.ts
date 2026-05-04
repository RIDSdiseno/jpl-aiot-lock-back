import { prisma } from "../../config/prisma";

export function listEvents() {
  return prisma.lockEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export function listLockEvents(lockId: string) {
  return prisma.lockEvent.findMany({
    where: { lockId },
    orderBy: { createdAt: "desc" },
  });
}
