import {
  AccessStatus,
  AuditAction,
  CommandStatus,
  CommandType,
  LockEventType,
  LockStatus,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createAuditLog } from "../audit/audit.service";
import { sendMockCommand } from "./iotMock.service";

async function ensureActiveAccess(userId: string, lockId: string, type: CommandType) {
  const lock = await prisma.lock.findFirstOrThrow({
    where: { id: lockId, deletedAt: null },
  });

  const access = await prisma.lockAccess.findFirst({
    where: {
      userId,
      lockId,
      status: AccessStatus.ACTIVE,
    },
  });

  if (!access) {
    throw new Error("User does not have active access to this lock");
  }

  if (type === CommandType.OPEN && !["OPEN", "OPEN_CLOSE", "ADMIN"].includes(access.accessType)) {
    throw new Error("User access does not allow opening this lock");
  }

  if (type === CommandType.CLOSE && !["CLOSE", "OPEN_CLOSE", "ADMIN"].includes(access.accessType)) {
    throw new Error("User access does not allow closing this lock");
  }

  return lock;
}

export async function sendLockCommand(lockId: string, userId: string, type: CommandType) {
  const lock = await ensureActiveAccess(userId, lockId, type);

  const command = await prisma.lockCommand.create({
    data: {
      lockId: lock.id,
      userId,
      type,
      status: CommandStatus.SENT,
      sentAt: new Date(),
      requestPayload: { provider: "mock" },
    },
  });

  await prisma.lockEvent.create({
    data: {
      lockId: lock.id,
      userId,
      type: type === CommandType.OPEN ? LockEventType.OPEN_REQUESTED : LockEventType.CLOSE_REQUESTED,
      message: `${type} command requested`,
    },
  });

  const response = await sendMockCommand(lock.id, type);
  const completedAt = new Date();
  const nextStatus = type === CommandType.OPEN ? LockStatus.UNLOCKED : LockStatus.LOCKED;
  const eventType = type === CommandType.OPEN ? LockEventType.OPENED : LockEventType.CLOSED;
  const auditAction = type === CommandType.OPEN ? AuditAction.OPEN_LOCK : AuditAction.CLOSE_LOCK;

  const [updatedCommand, updatedLock] = await prisma.$transaction([
    prisma.lockCommand.update({
      where: { id: command.id },
      data: {
        status: CommandStatus.SUCCESS,
        responsePayload: response,
        acknowledgedAt: completedAt,
        completedAt,
      },
    }),
    prisma.lock.update({
      where: { id: lock.id },
      data: { status: nextStatus, lastSyncAt: completedAt },
    }),
    prisma.lockEvent.create({
      data: {
        lockId: lock.id,
        userId,
        type: eventType,
        message: `Lock ${type === CommandType.OPEN ? "opened" : "closed"}`,
        rawPayload: response,
      },
    }),
    prisma.lockEvent.create({
      data: {
        lockId: lock.id,
        userId,
        type: LockEventType.COMMAND_SUCCESS,
        message: `${type} command completed successfully`,
        rawPayload: response,
      },
    }),
  ]);

  await createAuditLog({
    user: { connect: { id: userId } },
    action: auditAction,
    entity: "Lock",
    entityId: lock.id,
    description: `${type} command completed`,
  });

  return { command: updatedCommand, lock: updatedLock, response };
}

export function listLockCommands(lockId: string) {
  return prisma.lockCommand.findMany({
    where: { lockId },
    orderBy: { createdAt: "desc" },
  });
}
