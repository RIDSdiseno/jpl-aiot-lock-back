import { AccessStatus, AuditAction } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createAuditLog } from "../audit/audit.service";
import { CreateAccessInput } from "./access.schemas";

export async function assignAccess(lockId: string, data: CreateAccessInput, actorId?: string) {
  const access = await prisma.lockAccess.upsert({
    where: { userId_lockId: { userId: data.userId, lockId } },
    update: {
      accessType: data.accessType,
      status: data.status ?? AccessStatus.ACTIVE,
      validFrom: data.validFrom,
      validTo: data.validTo,
      allowedDays: data.allowedDays,
      allowedFromTime: data.allowedFromTime,
      allowedToTime: data.allowedToTime,
      reason: data.reason,
      revokedAt: null,
      createdById: actorId,
    },
    create: {
      userId: data.userId,
      lockId,
      accessType: data.accessType,
      status: data.status,
      validFrom: data.validFrom,
      validTo: data.validTo,
      allowedDays: data.allowedDays,
      allowedFromTime: data.allowedFromTime,
      allowedToTime: data.allowedToTime,
      reason: data.reason,
      createdById: actorId,
    },
  });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.ASSIGN,
    entity: "LockAccess",
    entityId: access.id,
    description: "Lock access assigned",
  });

  return access;
}

export function listLockAccess(lockId: string) {
  return prisma.lockAccess.findMany({
    where: { lockId },
    include: {
      user: {
        select: { id: true, name: true, email: true, status: true, companyId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function listUserLocks(userId: string) {
  return prisma.lockAccess.findMany({
    where: { userId, status: AccessStatus.ACTIVE, lock: { deletedAt: null } },
    include: { lock: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeAccess(lockId: string, accessId: string, actorId?: string) {
  const access = await prisma.lockAccess.update({
    where: { id: accessId },
    data: {
      status: AccessStatus.REVOKED,
      revokedAt: new Date(),
    },
  });

  if (access.lockId !== lockId) {
    throw new Error("Access does not belong to this lock");
  }

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.REVOKE,
    entity: "LockAccess",
    entityId: access.id,
    description: "Lock access revoked",
  });

  return access;
}
