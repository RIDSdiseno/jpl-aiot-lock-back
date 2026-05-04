import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { hashPassword } from "../../utils/password";
import { createAuditLog } from "../audit/audit.service";
import { CreateUserInput, UpdateUserInput } from "./users.schemas";

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
} satisfies Prisma.UserSelect;

export function listUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });
}

export function getUserById(id: string) {
  return prisma.user.findFirstOrThrow({
    where: { id, deletedAt: null },
    select: userSelect,
  });
}

export async function createUser(data: CreateUserInput, actorId?: string) {
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      phone: data.phone,
      status: data.status,
      companyId: data.companyId,
      roleId: data.roleId,
    },
    select: userSelect,
  });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.CREATE,
    entity: "User",
    entityId: user.id,
    description: "User created",
  });

  return user;
}

export async function updateUser(id: string, data: UpdateUserInput, actorId?: string) {
  const { password, ...rest } = data;
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      passwordHash: password ? await hashPassword(password) : undefined,
    },
    select: userSelect,
  });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.UPDATE,
    entity: "User",
    entityId: id,
    description: "User updated",
  });

  return user;
}

export async function deleteUser(id: string, actorId?: string) {
  const user = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: userSelect,
  });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.DELETE,
    entity: "User",
    entityId: id,
    description: "User soft deleted",
  });

  return user;
}
