"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const jwt_1 = require("../../utils/jwt");
const password_1 = require("../../utils/password");
const audit_service_1 = require("../audit/audit.service");
function sanitizeUser(user) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
}
async function register(data) {
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existingUser) {
        throw new Error("Email already registered");
    }
    const user = await prisma_1.prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash: await (0, password_1.hashPassword)(data.password),
            phone: data.phone,
            companyId: data.companyId,
            roleId: data.roleId,
        },
    });
    await (0, audit_service_1.createAuditLog)({
        action: client_1.AuditAction.CREATE,
        entity: "User",
        entityId: user.id,
        description: "User registered",
        newValues: sanitizeUser(user),
    });
    return sanitizeUser(user);
}
async function login(data, meta) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (!user || user.deletedAt) {
        throw new Error("Invalid credentials");
    }
    const isValidPassword = await (0, password_1.comparePassword)(data.password, user.passwordHash);
    if (!isValidPassword) {
        throw new Error("Invalid credentials");
    }
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    const payload = {
        id: updatedUser.id,
        email: updatedUser.email,
        roleId: updatedUser.roleId,
        companyId: updatedUser.companyId,
    };
    await (0, audit_service_1.createAuditLog)({
        user: { connect: { id: updatedUser.id } },
        action: client_1.AuditAction.LOGIN,
        entity: "User",
        entityId: updatedUser.id,
        description: "User login",
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
    });
    return {
        user: sanitizeUser(updatedUser),
        accessToken: (0, jwt_1.signAccessToken)(payload),
        refreshToken: (0, jwt_1.signRefreshToken)(payload),
    };
}
async function me(userId) {
    const user = await prisma_1.prisma.user.findFirstOrThrow({
        where: { id: userId, deletedAt: null },
    });
    return sanitizeUser(user);
}
