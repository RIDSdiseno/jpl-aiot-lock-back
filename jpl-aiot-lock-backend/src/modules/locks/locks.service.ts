import { AuditAction } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createAuditLog } from "../audit/audit.service";
import { CreateLockInput, UpdateLockInput } from "./locks.schemas";

export function listLocks() {
  return prisma.lock.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function getLockById(id: string) {
  return prisma.lock.findFirstOrThrow({
    where: { id, deletedAt: null },
  });
}

export async function createLock(data: CreateLockInput, actorId?: string) {
  const lock = await prisma.lock.create({ data });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.CREATE,
    entity: "Lock",
    entityId: lock.id,
    description: "Lock created",
  });

  return lock;
}

export async function updateLock(id: string, data: UpdateLockInput, actorId?: string) {
  const lock = await prisma.lock.update({
    where: { id },
    data,
  });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.UPDATE,
    entity: "Lock",
    entityId: id,
    description: "Lock updated",
  });

  return lock;
}

export async function deleteLock(id: string, actorId?: string) {
  const lock = await prisma.lock.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.DELETE,
    entity: "Lock",
    entityId: id,
    description: "Lock soft deleted",
  });

  return lock;
}
