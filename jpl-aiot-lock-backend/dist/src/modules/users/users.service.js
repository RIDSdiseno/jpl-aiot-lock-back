"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const password_1 = require("../../utils/password");
const audit_service_1 = require("../audit/audit.service");
const userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    status: true,
    companyId: true,
    roleId: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
};
function listUsers() {
    return prisma_1.prisma.user.findMany({
        where: { deletedAt: null },
        select: userSelect,
        orderBy: { createdAt: "desc" },
    });
}
function getUserById(id) {
    return prisma_1.prisma.user.findFirstOrThrow({
        where: { id, deletedAt: null },
        select: userSelect,
    });
}
async function createUser(data, actorId) {
    const user = await prisma_1.prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash: await (0, password_1.hashPassword)(data.password),
            phone: data.phone,
            status: data.status,
            companyId: data.companyId,
            roleId: data.roleId,
        },
        select: userSelect,
    });
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.CREATE,
        entity: "User",
        entityId: user.id,
        description: "User created",
    });
    return user;
}
async function updateUser(id, data, actorId) {
    const { password, ...rest } = data;
    const user = await prisma_1.prisma.user.update({
        where: { id },
        data: {
            ...rest,
            passwordHash: password ? await (0, password_1.hashPassword)(password) : undefined,
        },
        select: userSelect,
    });
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.UPDATE,
        entity: "User",
        entityId: id,
        description: "User updated",
    });
    return user;
}
async function deleteUser(id, actorId) {
    const user = await prisma_1.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: userSelect,
    });
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.DELETE,
        entity: "User",
        entityId: id,
        description: "User soft deleted",
    });
    return user;
}
