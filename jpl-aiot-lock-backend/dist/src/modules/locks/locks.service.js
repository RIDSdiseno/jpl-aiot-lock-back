"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLocks = listLocks;
exports.getLockById = getLockById;
exports.createLock = createLock;
exports.updateLock = updateLock;
exports.deleteLock = deleteLock;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const audit_service_1 = require("../audit/audit.service");
function listLocks() {
    return prisma_1.prisma.lock.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
    });
}
function getLockById(id) {
    return prisma_1.prisma.lock.findFirstOrThrow({
        where: { id, deletedAt: null },
    });
}
async function createLock(data, actorId) {
    const lock = await prisma_1.prisma.lock.create({ data });
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.CREATE,
        entity: "Lock",
        entityId: lock.id,
        description: "Lock created",
    });
    return lock;
}
async function updateLock(id, data, actorId) {
    const lock = await prisma_1.prisma.lock.update({
        where: { id },
        data,
    });
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.UPDATE,
        entity: "Lock",
        entityId: id,
        description: "Lock updated",
    });
    return lock;
}
async function deleteLock(id, actorId) {
    const lock = await prisma_1.prisma.lock.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.DELETE,
        entity: "Lock",
        entityId: id,
        description: "Lock soft deleted",
    });
    return lock;
}
