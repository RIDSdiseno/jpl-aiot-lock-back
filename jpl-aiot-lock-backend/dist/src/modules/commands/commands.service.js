"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLockCommand = sendLockCommand;
exports.listLockCommands = listLockCommands;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const audit_service_1 = require("../audit/audit.service");
const iotMock_service_1 = require("./iotMock.service");
async function ensureActiveAccess(userId, lockId, type) {
    const lock = await prisma_1.prisma.lock.findFirstOrThrow({
        where: { id: lockId, deletedAt: null },
    });
    const access = await prisma_1.prisma.lockAccess.findFirst({
        where: {
            userId,
            lockId,
            status: client_1.AccessStatus.ACTIVE,
        },
    });
    if (!access) {
        throw new Error("User does not have active access to this lock");
    }
    if (type === client_1.CommandType.OPEN && !["OPEN", "OPEN_CLOSE", "ADMIN"].includes(access.accessType)) {
        throw new Error("User access does not allow opening this lock");
    }
    if (type === client_1.CommandType.CLOSE && !["CLOSE", "OPEN_CLOSE", "ADMIN"].includes(access.accessType)) {
        throw new Error("User access does not allow closing this lock");
    }
    return lock;
}
async function sendLockCommand(lockId, userId, type) {
    const lock = await ensureActiveAccess(userId, lockId, type);
    const command = await prisma_1.prisma.lockCommand.create({
        data: {
            lockId: lock.id,
            userId,
            type,
            status: client_1.CommandStatus.SENT,
            sentAt: new Date(),
            requestPayload: { provider: "mock" },
        },
    });
    await prisma_1.prisma.lockEvent.create({
        data: {
            lockId: lock.id,
            userId,
            type: type === client_1.CommandType.OPEN ? client_1.LockEventType.OPEN_REQUESTED : client_1.LockEventType.CLOSE_REQUESTED,
            message: `${type} command requested`,
        },
    });
    const response = await (0, iotMock_service_1.sendMockCommand)(lock.id, type);
    const completedAt = new Date();
    const nextStatus = type === client_1.CommandType.OPEN ? client_1.LockStatus.UNLOCKED : client_1.LockStatus.LOCKED;
    const eventType = type === client_1.CommandType.OPEN ? client_1.LockEventType.OPENED : client_1.LockEventType.CLOSED;
    const auditAction = type === client_1.CommandType.OPEN ? client_1.AuditAction.OPEN_LOCK : client_1.AuditAction.CLOSE_LOCK;
    const [updatedCommand, updatedLock] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.lockCommand.update({
            where: { id: command.id },
            data: {
                status: client_1.CommandStatus.SUCCESS,
                responsePayload: response,
                acknowledgedAt: completedAt,
                completedAt,
            },
        }),
        prisma_1.prisma.lock.update({
            where: { id: lock.id },
            data: { status: nextStatus, lastSyncAt: completedAt },
        }),
        prisma_1.prisma.lockEvent.create({
            data: {
                lockId: lock.id,
                userId,
                type: eventType,
                message: `Lock ${type === client_1.CommandType.OPEN ? "opened" : "closed"}`,
                rawPayload: response,
            },
        }),
        prisma_1.prisma.lockEvent.create({
            data: {
                lockId: lock.id,
                userId,
                type: client_1.LockEventType.COMMAND_SUCCESS,
                message: `${type} command completed successfully`,
                rawPayload: response,
            },
        }),
    ]);
    await (0, audit_service_1.createAuditLog)({
        user: { connect: { id: userId } },
        action: auditAction,
        entity: "Lock",
        entityId: lock.id,
        description: `${type} command completed`,
    });
    return { command: updatedCommand, lock: updatedLock, response };
}
function listLockCommands(lockId) {
    return prisma_1.prisma.lockCommand.findMany({
        where: { lockId },
        orderBy: { createdAt: "desc" },
    });
}
