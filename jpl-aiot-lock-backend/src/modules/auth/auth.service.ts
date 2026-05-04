import { AuditAction } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import { comparePassword, hashPassword } from "../../utils/password";
import { createAuditLog } from "../audit/audit.service";
import { LoginInput, RegisterInput } from "./auth.schemas";

function sanitizeUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function register(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      phone: data.phone,
      companyId: data.companyId,
      roleId: data.roleId,
    },
  });

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: "User",
    entityId: user.id,
    description: "User registered",
    newValues: sanitizeUser(user),
  });

  return sanitizeUser(user);
}

export async function login(data: LoginInput, meta?: { ip?: string; userAgent?: string }) {
  const identifier = data.username ?? data.email;

  if (!identifier) {
    throw new Error("Invalid credentials");
  }

  const user = await prisma.user.findFirst({
    where: { email: identifier },
    include: { role: true },
  });

  if (!user || user.deletedAt || user.status !== "ACTIVE") {
    throw new Error("Invalid credentials");
  }

  const isValidPassword = await comparePassword(data.password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error("Invalid credentials");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    include: { role: true },
  });

  const payload = {
    userId: updatedUser.id,
    id: updatedUser.id,
    role: updatedUser.role?.name,
    companyId: updatedUser.companyId,
  };

  await createAuditLog({
    user: { connect: { id: updatedUser.id } },
    action: AuditAction.LOGIN,
    entity: "User",
    entityId: updatedUser.id,
    description: "User login",
    ipAddress: meta?.ip,
    userAgent: meta?.userAgent,
  });

  return {
    message: "Login exitoso",
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: sanitizeUser(updatedUser),
  };
}

export async function me(userId: string) {
  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId, deletedAt: null },
    include: { role: true },
  });

  return sanitizeUser(user);
}
