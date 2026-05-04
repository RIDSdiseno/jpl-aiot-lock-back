"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignAccess = assignAccess;
exports.listLockAccess = listLockAccess;
exports.listUserLocks = listUserLocks;
exports.revokeAccess = revokeAccess;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const audit_service_1 = require("../audit/audit.service");
async function assignAccess(lockId, data, actorId) {
    const access = await prisma_1.prisma.lockAccess.upsert({
        where: { userId_lockId: { userId: data.userId, lockId } },
        update: {
            accessType: data.accessType,
            status: data.status ?? client_1.AccessStatus.ACTIVE,
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
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.ASSIGN,
        entity: "LockAccess",
        entityId: access.id,
        description: "Lock access assigned",
    });
    return access;
}
function listLockAccess(lockId) {
    return prisma_1.prisma.lockAccess.findMany({
        where: { lockId },
        include: {
            user: {
                select: { id: true, name: true, email: true, status: true, companyId: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
function listUserLocks(userId) {
    return prisma_1.prisma.lockAccess.findMany({
        where: { userId, status: client_1.AccessStatus.ACTIVE, lock: { deletedAt: null } },
        include: { lock: true },
        orderBy: { createdAt: "desc" },
    });
}
async function revokeAccess(lockId, accessId, actorId) {
    const access = await prisma_1.prisma.lockAccess.update({
        where: { id: accessId },
        data: {
            status: client_1.AccessStatus.REVOKED,
            revokedAt: new Date(),
        },
    });
    if (access.lockId !== lockId) {
        throw new Error("Access does not belong to this lock");
    }
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.REVOKE,
        entity: "LockAccess",
        entityId: access.id,
        description: "Lock access revoked",
    });
    return access;
}
