import { AuditAction, Prisma, UserStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { hashPassword } from "../../utils/password";
import { createAuditLog } from "../audit/audit.service";

const router = Router();
router.use(authMiddleware);

function audit(userId: string | undefined, description: string, entity: string, entityId?: string, values?: Prisma.InputJsonValue) {
  return createAuditLog({
    user: userId ? { connect: { id: userId } } : undefined,
    action: AuditAction.SYSTEM_EVENT,
    entity,
    entityId,
    description,
    newValues: values,
  }).catch(() => undefined);
}

const companySchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  parentCompanyId: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  timezone: z.string().min(1).default("America/Santiago"),
  useParentRole: z.boolean().default(false),
  roleId: z.string().optional().nullable(),
  pushEnabled: z.boolean().default(true),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

router.get("/organizations", async (req, res) => {
  const q = req.query;
  const items = await prisma.company.findMany({
    where: {
      deletedAt: null,
      name: typeof q.companyName === "string" && q.companyName ? { contains: q.companyName, mode: "insensitive" } : undefined,
      phone: typeof q.phone === "string" && q.phone ? { contains: q.phone, mode: "insensitive" } : undefined,
      status: typeof q.status === "string" && q.status ? q.status as "ACTIVE" | "INACTIVE" | "SUSPENDED" : undefined,
    },
    orderBy: { createdAt: "desc" },
  });
  await audit(req.user?.id, "COMPANY_VIEWED", "Company", undefined, { count: items.length });
  res.json({ ok: true, data: items.map((item) => ({
    ...item,
    companyName: item.name,
    contactName: item.rut,
    timezone: (item as unknown as { timezone?: string }).timezone ?? "America/Santiago",
    pushEnabled: (item as unknown as { pushEnabled?: boolean }).pushEnabled ?? true,
  })) });
});

router.get("/organizations/:id", async (req, res) => {
  const item = await prisma.company.findFirstOrThrow({ where: { id: req.params.id, deletedAt: null } });
  await audit(req.user?.id, "COMPANY_VIEWED", "Company", item.id);
  res.json({ ok: true, data: { ...item, companyName: item.name, contactName: item.rut } });
});

router.post("/organizations", async (req, res) => {
  const body = companySchema.parse(req.body);
  const item = await prisma.company.create({
    data: {
      name: body.companyName,
      rut: body.contactName,
      email: body.email || null,
      phone: body.phone,
      status: body.status,
    },
  });
  await audit(req.user?.id, "COMPANY_CREATED", "Company", item.id, { companyName: item.name });
  res.status(201).json({ ok: true, data: { ...item, companyName: item.name, contactName: item.rut } });
});

router.patch("/organizations/:id", async (req, res) => {
  const body = companySchema.partial().parse(req.body);
  const item = await prisma.company.update({
    where: { id: req.params.id },
    data: {
      name: body.companyName,
      rut: body.contactName,
      email: body.email || undefined,
      phone: body.phone,
      status: body.status,
    },
  });
  await audit(req.user?.id, "COMPANY_UPDATED", "Company", item.id, { companyName: item.name });
  res.json({ ok: true, data: { ...item, companyName: item.name, contactName: item.rut } });
});

router.delete("/organizations/:id", async (req, res) => {
  const item = await prisma.company.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  await audit(req.user?.id, "COMPANY_DELETED", "Company", item.id);
  res.json({ ok: true });
});

const roleSchema = z.object({
  roleName: z.string().min(1),
  companyId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

router.get("/roles", async (req, res) => {
  const roles = await prisma.role.findMany({
    where: { name: typeof req.query.roleName === "string" && req.query.roleName ? { contains: req.query.roleName, mode: "insensitive" } : undefined },
    orderBy: { createdAt: "desc" },
    include: { permissions: { include: { permission: true } } },
  });
  res.json({ ok: true, data: roles.map((role) => ({ ...role, roleName: role.name, permissions: role.permissions.map((p) => p.permission.code) })) });
});

router.get("/roles/:id", async (req, res) => {
  const role = await prisma.role.findUniqueOrThrow({ where: { id: req.params.id }, include: { permissions: { include: { permission: true } } } });
  res.json({ ok: true, data: { ...role, roleName: role.name, permissions: role.permissions.map((p) => p.permission.code) } });
});

router.post("/roles", async (req, res) => {
  const body = roleSchema.parse(req.body);
  const role = await prisma.role.create({ data: { name: body.roleName, description: body.description } });
  await audit(req.user?.id, "ROLE_CREATED", "Role", role.id, { roleName: role.name, companyId: body.companyId });
  res.status(201).json({ ok: true, data: { ...role, roleName: role.name } });
});

router.patch("/roles/:id", async (req, res) => {
  const body = roleSchema.partial().parse(req.body);
  const role = await prisma.role.update({ where: { id: req.params.id }, data: { name: body.roleName, description: body.description } });
  await audit(req.user?.id, "ROLE_UPDATED", "Role", role.id);
  res.json({ ok: true, data: { ...role, roleName: role.name } });
});

router.delete("/roles/:id", async (req, res) => {
  const role = await prisma.role.findUniqueOrThrow({ where: { id: req.params.id } });
  if (role.name === "SUPER_ADMIN") return res.status(400).json({ ok: false, message: "SUPER_ADMIN cannot be deleted" });
  await prisma.role.delete({ where: { id: req.params.id } });
  await audit(req.user?.id, "ROLE_DELETED", "Role", role.id);
  res.json({ ok: true });
});

router.get("/roles/:id/permissions", async (req, res) => {
  const [all, selected] = await Promise.all([
    prisma.permission.findMany({ orderBy: { code: "asc" } }),
    prisma.rolePermission.findMany({ where: { roleId: req.params.id }, include: { permission: true } }),
  ]);
  await audit(req.user?.id, "PERMISSION_VIEWED", "Role", req.params.id);
  res.json({ ok: true, data: { all, selected: selected.map((item) => item.permission.code) } });
});

router.put("/roles/:id/permissions", async (req, res) => {
  const body = z.object({ permissionCodes: z.array(z.string()) }).parse(req.body);
  const role = await prisma.role.findUniqueOrThrow({ where: { id: req.params.id } });
  if (role.name === "SUPER_ADMIN" && body.permissionCodes.length === 0) {
    return res.status(400).json({ ok: false, message: "SUPER_ADMIN must keep permissions" });
  }
  const permissions = await prisma.permission.findMany({ where: { code: { in: body.permissionCodes } } });
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
    ...permissions.map((permission) => prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } })),
  ]);
  await audit(req.user?.id, "ROLE_PERMISSION_ASSIGNED", "Role", role.id, { permissionCodes: body.permissionCodes });
  res.json({ ok: true, data: { permissionCodes: body.permissionCodes } });
});

const userSchema = z.object({
  username: z.string().min(1),
  nickname: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  companyId: z.string().min(1),
  roleId: z.string().min(1),
  password: z.string().min(8).optional(),
  accountStatus: z.enum(["ACTIVE", "DISABLED", "LOCKED"]).default("ACTIVE"),
});

function userStatus(status?: "ACTIVE" | "DISABLED" | "LOCKED"): UserStatus | undefined {
  if (!status) return undefined;
  if (status === "DISABLED") return "INACTIVE";
  if (status === "LOCKED") return "BLOCKED";
  return "ACTIVE";
}

function accountStatus(status: UserStatus) {
  if (status === "INACTIVE") return "DISABLED";
  if (status === "BLOCKED") return "LOCKED";
  return "ACTIVE";
}

router.get("/users", async (req, res) => {
  const q = req.query;
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      email: typeof q.email === "string" && q.email ? { contains: q.email, mode: "insensitive" } : typeof q.username === "string" && q.username ? { contains: q.username, mode: "insensitive" } : undefined,
      phone: typeof q.phone === "string" && q.phone ? { contains: q.phone, mode: "insensitive" } : undefined,
      companyId: typeof q.companyId === "string" && q.companyId ? q.companyId : undefined,
      roleId: typeof q.roleId === "string" && q.roleId ? q.roleId : undefined,
    },
    include: { company: true, role: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ ok: true, data: users.map(({ passwordHash: _passwordHash, ...user }) => ({ ...user, username: user.email, nickname: user.name, accountStatus: accountStatus(user.status), companyName: user.company?.name, roleName: user.role?.name })) });
});

router.get("/users/:id", async (req, res) => {
  const { passwordHash: _passwordHash, ...user } = await prisma.user.findFirstOrThrow({ where: { id: req.params.id, deletedAt: null }, include: { company: true, role: true } });
  res.json({ ok: true, data: { ...user, username: user.email, nickname: user.name, accountStatus: accountStatus(user.status), companyName: user.company?.name, roleName: user.role?.name } });
});

router.post("/users", async (req, res) => {
  const body = userSchema.extend({ password: z.string().min(8) }).parse(req.body);
  if (body.password !== req.body.confirmPassword) return res.status(400).json({ ok: false, message: "Passwords do not match" });
  const user = await prisma.user.create({
    data: { email: body.email || body.username, name: body.nickname, phone: body.phone, companyId: body.companyId, roleId: body.roleId, status: userStatus(body.accountStatus), passwordHash: await hashPassword(body.password) },
  });
  await audit(req.user?.id, "USER_CREATED", "User", user.id, { username: user.email });
  const { passwordHash: _passwordHash, ...safeUser } = user;
  res.status(201).json({ ok: true, data: safeUser });
});

router.patch("/users/:id", async (req, res) => {
  const body = userSchema.partial().parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name: body.nickname, email: body.email, phone: body.phone, companyId: body.companyId, roleId: body.roleId, status: userStatus(body.accountStatus) },
  });
  await audit(req.user?.id, "USER_UPDATED", "User", user.id);
  const { passwordHash: _passwordHash, ...safeUser } = user;
  res.json({ ok: true, data: safeUser });
});

router.delete("/users/:id", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id }, include: { role: true } });
  if (user.role?.name === "SUPER_ADMIN") {
    const count = await prisma.user.count({ where: { deletedAt: null, role: { name: "SUPER_ADMIN" }, status: "ACTIVE" } });
    if (count <= 1) return res.status(400).json({ ok: false, message: "Cannot delete last super admin" });
  }
  await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  await audit(req.user?.id, "USER_DELETED", "User", user.id);
  res.json({ ok: true });
});

router.post("/users/:id/change-password", async (req, res) => {
  const body = z.object({ password: z.string().min(8), confirmPassword: z.string().min(8) }).parse(req.body);
  if (body.password !== body.confirmPassword) return res.status(400).json({ ok: false, message: "Passwords do not match" });
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash: await hashPassword(body.password) } });
  await audit(req.user?.id, "USER_PASSWORD_CHANGED", "User", req.params.id);
  res.json({ ok: true });
});

router.post("/users/:id/enable", async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: "ACTIVE" } });
  await audit(req.user?.id, "USER_ENABLED", "User", user.id);
  res.json({ ok: true });
});

router.post("/users/:id/disable", async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: "INACTIVE" } });
  await audit(req.user?.id, "USER_DISABLED", "User", user.id);
  res.json({ ok: true });
});

export default router;
