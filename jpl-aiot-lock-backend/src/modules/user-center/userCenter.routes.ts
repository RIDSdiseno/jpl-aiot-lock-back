import { AuditAction, CompanyStatus, Prisma, UserStatus } from "@prisma/client";
import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { hashPassword } from "../../utils/password";
import { createAuditLog } from "../audit/audit.service";

const router = Router();
router.use(authMiddleware);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const LIMITS = [20, 50, 100];

const permissionCatalog = [
  ["Home Page", "HOME_VIEW"],
  ["Monitoring", "MONITORING_VIEW"],
  ["Monitoring", "MONITORING_EXPORT"],
  ["Control", "CONTROL_VIEW"],
  ["Control", "NFC_VIEW"],
  ["Control", "NFC_MANAGE"],
  ["Control", "PASSWORD_VIEW"],
  ["Control", "PASSWORD_MANAGE"],
  ["Control", "CMD_RECORD_VIEW"],
  ["Control", "CMD_SEND"],
  ["Control", "PARAMETER_VIEW"],
  ["Control", "PARAMETER_READ"],
  ["Control", "PARAMETER_UPDATE"],
  ["Event", "EVENT_VIEW"],
  ["Event", "EVENT_EXPORT"],
  ["Event", "ALARM_VIEW"],
  ["Event", "ALARM_UPDATE_STATUS"],
  ["Event", "PUSH_EVENT_VIEW"],
  ["GIS", "GIS_VIEW"],
  ["GIS", "GEOFENCE_VIEW"],
  ["GIS", "GEOFENCE_CREATE"],
  ["GIS", "GEOFENCE_UPDATE"],
  ["GIS", "GEOFENCE_DELETE"],
  ["Report", "REPORT_VIEW"],
  ["Report", "REPORT_EXPORT"],
  ["Report", "APP_SEAL_UNSEAL_REPORT_VIEW"],
  ["Report", "LOCK_UNLOCK_REPORT_VIEW"],
  ["Report", "FENCE_REPORT_VIEW"],
  ["Report", "USER_LOG_REPORT_VIEW"],
  ["Device", "DEVICE_VIEW"],
  ["Device", "DEVICE_CREATE"],
  ["Device", "DEVICE_UPDATE"],
  ["Device", "DEVICE_DELETE"],
  ["Device", "DEVICE_BATCH_IMPORT"],
  ["Device", "DEVICE_BATCH_UPDATE"],
  ["Device", "DEVICE_ASSIGN_COMPANY"],
  ["Device", "DEVICE_EXPORT"],
  ["Maintain", "MAINTAIN_VIEW"],
  ["Maintain", "OTA_VIEW"],
  ["Maintain", "OTA_UPLOAD"],
  ["Maintain", "OTA_EXECUTE"],
  ["Maintain", "DIAGNOSIS_VIEW"],
  ["Maintain", "DIAGNOSIS_EXECUTE"],
  ["History", "HISTORY_VIEW"],
  ["History", "HISTORY_EXPORT"],
  ["User Center", "USER_CENTER_VIEW"],
  ["User Center", "ORGANIZATION_VIEW"],
  ["User Center", "ORGANIZATION_CREATE"],
  ["User Center", "ORGANIZATION_UPDATE"],
  ["User Center", "ORGANIZATION_DELETE"],
  ["User Center", "ROLE_VIEW"],
  ["User Center", "ROLE_CREATE"],
  ["User Center", "ROLE_UPDATE"],
  ["User Center", "ROLE_DELETE"],
  ["User Center", "ROLE_PERMISSION_MANAGE"],
  ["User Center", "USER_VIEW"],
  ["User Center", "USER_CREATE"],
  ["User Center", "USER_UPDATE"],
  ["User Center", "USER_DELETE"],
  ["User Center", "USER_CHANGE_PASSWORD"],
  ["User Center", "USER_STATUS_UPDATE"],
] as const;

const organizationSchema = z.object({
  companyName: z.string().trim().min(1).max(150),
  contactName: z.string().trim().max(100).optional().nullable(),
  email: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  country: z.string().trim().default("Chile"),
  timezone: z.string().trim().default("America/Santiago"),
  address: z.string().trim().max(250).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  parentOrganizationId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const roleSchema = z.object({
  roleName: z.string().trim().min(1).max(100),
  organizationId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
});

const userSchema = z.object({
  username: z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9._-]+$/),
  nickname: z.string().trim().max(100).optional().nullable(),
  email: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  phoneNumber: z.string().trim().max(40).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  organizationId: z.string().min(1),
  companyId: z.string().optional().nullable(),
  roleId: z.string().min(1),
  accountStatus: z.boolean().default(true),
});

const createUserSchema = userSchema.extend({
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  forceChangeOnNextLogin: z.boolean().optional(),
});

type AsyncRoute = (req: Request, res: Response) => Promise<void>;

function asyncRoute(handler: AsyncRoute) {
  return (req: Request, res: Response) => {
    handler(req, res).catch((error) => {
      console.error("[USER_CENTER]", error);
      res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", "Internal server error"));
    });
  };
}

function mutationResponse(message: string, data?: unknown) {
  return { ok: true, message, data: data ?? {} };
}

function listResponse(data: unknown[], page: number, limit: number, total: number) {
  return {
    ok: true,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

function errorResponse(code: string, message: string) {
  return { ok: false, code, message };
}

function validationError(res: Response, code: string, message: string) {
  console.warn("[USER_CENTER][VALIDATION_ERROR]", code);
  return res.status(400).json(errorResponse(code, message));
}

function getPage(req: Request) {
  const page = Number(req.query.page ?? DEFAULT_PAGE);
  const limit = Number(req.query.limit ?? DEFAULT_LIMIT);
  return {
    page: Number.isFinite(page) && page > 0 ? page : DEFAULT_PAGE,
    limit: LIMITS.includes(limit) ? limit : DEFAULT_LIMIT,
  };
}

function parseSortOrder(value: unknown): Prisma.SortOrder {
  return value === "asc" ? "asc" : "desc";
}

function mapCompany(company: {
  id: string;
  name: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: company.id,
    companyName: company.name,
    contactName: company.rut ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    country: "Chile",
    timezone: "America/Santiago",
    address: company.address ?? "",
    description: "",
    parentOrganizationId: null,
    isActive: company.status === "ACTIVE",
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

function mapRole(role: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Array<{ permission: { code: string } }>;
}, sortNo?: number) {
  return {
    id: role.id,
    sortNo,
    roleName: role.name,
    organizationId: null,
    organizationName: "Global",
    description: role.description ?? "",
    isSystemRole: isSystemRole(role.name),
    isActive: true,
    permissions: role.permissions?.map((item) => item.permission.code) ?? [],
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

function mapUser(user: Prisma.UserGetPayload<{ include: { company: true; role: true } }> | (Prisma.UserGetPayload<Record<string, never>> & { company?: { name: string } | null; role?: { name: string } | null }), sortNo?: number) {
  return {
    id: user.id,
    sortNo,
    username: user.email,
    nickname: user.name ?? "",
    email: user.email.includes("@") ? user.email : "",
    phoneNumber: user.phone ?? "",
    organizationId: user.companyId,
    organizationName: user.company?.name ?? "",
    roleId: user.roleId,
    roleName: user.role?.name ?? "",
    accountStatus: user.status === "ACTIVE",
    isActive: user.status === "ACTIVE",
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isSystemRole(roleName: string) {
  return ["SUPER_ADMIN", "ADMIN", "JPL Admin"].includes(roleName);
}

function isAdminRole(roleName?: string | null) {
  return Boolean(roleName && /admin/i.test(roleName));
}

async function audit(req: Request, action: string, entityType: string, entityId?: string, beforeData?: unknown, afterData?: unknown) {
  const safeAfter = action === "CHANGE_PASSWORD" ? undefined : afterData;
  await createAuditLog({
    user: req.user?.id ? { connect: { id: req.user.id } } : undefined,
    action: AuditAction.SYSTEM_EVENT,
    entity: entityType,
    entityId,
    description: action,
    oldValues: beforeData as Prisma.InputJsonValue,
    newValues: safeAfter as Prisma.InputJsonValue,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  }).catch(() => undefined);
}

async function ensurePermissions() {
  await Promise.all(
    permissionCatalog.map(([module, code]) =>
      prisma.permission.upsert({
        where: { code },
        update: { name: code, description: module },
        create: { code, name: code, description: module },
      }),
    ),
  );
}

router.get("/options", asyncRoute(async (_req, res) => {
  console.log("[USER_CENTER][OPTIONS]");
  await ensurePermissions();
  const [organizations, roles] = await Promise.all([
    prisma.company.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  res.json({
    ok: true,
    data: {
      organizations: organizations.map((item) => ({ id: item.id, name: item.name })),
      roles: roles.map((item) => ({ id: item.id, name: item.name, organizationId: null })),
      countries: ["Chile"],
      timezones: [{ label: "(CLT) (UTC-4:00)", value: "America/Santiago" }],
      accountStatuses: [
        { label: "Active", value: true },
        { label: "Disabled", value: false },
      ],
      permissions: permissionCatalog.map(([module, code]) => ({ module, code, name: code })),
    },
  });
}));

router.get("/organizations", asyncRoute(async (req, res) => {
  console.log("[ORGANIZATION][LIST]");
  const { page, limit } = getPage(req);
  const sortBy = req.query.sortBy === "companyName" ? "name" : "createdAt";
  const where: Prisma.CompanyWhereInput = {
    deletedAt: null,
    name: typeof req.query.companyName === "string" && req.query.companyName ? { contains: req.query.companyName, mode: "insensitive" } : undefined,
    phone: typeof req.query.phone === "string" && req.query.phone ? { contains: req.query.phone, mode: "insensitive" } : undefined,
  };
  const [total, items] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: parseSortOrder(req.query.sortOrder) },
    }),
  ]);
  res.json(listResponse(items.map(mapCompany), page, limit, total));
}));

router.get("/organizations/:id", asyncRoute(async (req, res) => {
  const item = await prisma.company.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!item) return void res.status(404).json(errorResponse("ORGANIZATION_NOT_FOUND", "Organization not found"));
  res.json({ ok: true, data: mapCompany(item) });
}));

router.post("/organizations", asyncRoute(async (req, res) => {
  console.log("[ORGANIZATION][CREATE]");
  const parsed = organizationSchema.safeParse(req.body);
  if (!parsed.success) return void validationError(res, parsed.error.issues[0]?.code === "invalid_string" ? "INVALID_EMAIL" : "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid organization");

  const exists = await prisma.company.findFirst({ where: { deletedAt: null, name: { equals: parsed.data.companyName, mode: "insensitive" } } });
  if (exists) return void validationError(res, "ORGANIZATION_ALREADY_EXISTS", "Organization already exists");

  const item = await prisma.company.create({
    data: {
      name: parsed.data.companyName,
      rut: parsed.data.contactName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      status: parsed.data.isActive ? "ACTIVE" : "INACTIVE",
    },
  });
  const data = mapCompany(item);
  await audit(req, "CREATE_ORGANIZATION", "Company", item.id, undefined, data);
  res.status(201).json(mutationResponse("Operation completed successfully", data));
}));

router.patch("/organizations/:id", asyncRoute(async (req, res) => {
  console.log("[ORGANIZATION][UPDATE]");
  const parsed = organizationSchema.partial().safeParse(req.body);
  if (!parsed.success) return void validationError(res, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid organization");

  const current = await prisma.company.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!current) return void res.status(404).json(errorResponse("ORGANIZATION_NOT_FOUND", "Organization not found"));

  if (parsed.data.companyName && parsed.data.companyName.toLowerCase() !== current.name.toLowerCase()) {
    const exists = await prisma.company.findFirst({ where: { deletedAt: null, name: { equals: parsed.data.companyName, mode: "insensitive" }, id: { not: current.id } } });
    if (exists) return void validationError(res, "ORGANIZATION_ALREADY_EXISTS", "Organization already exists");
  }

  const item = await prisma.company.update({
    where: { id: current.id },
    data: {
      name: parsed.data.companyName,
      rut: parsed.data.contactName,
      email: parsed.data.email === "" ? null : parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      status: typeof parsed.data.isActive === "boolean" ? (parsed.data.isActive ? "ACTIVE" : "INACTIVE") : undefined,
    },
  });
  const data = mapCompany(item);
  await audit(req, "UPDATE_ORGANIZATION", "Company", item.id, mapCompany(current), data);
  res.json(mutationResponse("Operation completed successfully", data));
}));

router.delete("/organizations/:id", asyncRoute(async (req, res) => {
  console.log("[ORGANIZATION][DELETE]");
  const item = await prisma.company.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!item) return void res.status(404).json(errorResponse("ORGANIZATION_NOT_FOUND", "Organization not found"));

  const [users, devices, locks] = await Promise.all([
    prisma.user.count({ where: { companyId: item.id, deletedAt: null, status: "ACTIVE" } }),
    prisma.device.count({ where: { companyId: item.id, deletedAt: null } }),
    prisma.lock.count({ where: { companyId: item.id, deletedAt: null } }),
  ]);

  const deleted = await prisma.company.update({ where: { id: item.id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  await audit(req, "DELETE_ORGANIZATION", "Company", item.id, mapCompany(item), { softDeleted: true, users, devices: devices + locks });
  res.json(mutationResponse("Operation completed successfully", mapCompany(deleted)));
}));

router.get("/roles", asyncRoute(async (req, res) => {
  console.log("[ROLE][LIST]");
  const { page, limit } = getPage(req);
  const where: Prisma.RoleWhereInput = {
    name: typeof req.query.roleName === "string" && req.query.roleName ? { contains: req.query.roleName, mode: "insensitive" } : undefined,
  };
  const [total, roles] = await Promise.all([
    prisma.role.count({ where }),
    prisma.role.findMany({
      where,
      include: { permissions: { include: { permission: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: parseSortOrder(req.query.sortOrder) },
    }),
  ]);
  res.json(listResponse(roles.map((role, index) => mapRole(role, (page - 1) * limit + index + 1)), page, limit, total));
}));

router.get("/roles/:id", asyncRoute(async (req, res) => {
  const role = await prisma.role.findUnique({ where: { id: req.params.id }, include: { permissions: { include: { permission: true } } } });
  if (!role) return void res.status(404).json(errorResponse("ROLE_NOT_FOUND", "Role not found"));
  res.json({ ok: true, data: mapRole(role) });
}));

router.post("/roles", asyncRoute(async (req, res) => {
  console.log("[ROLE][CREATE]");
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) return void validationError(res, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid role");
  const exists = await prisma.role.findFirst({ where: { name: { equals: parsed.data.roleName, mode: "insensitive" } } });
  if (exists) return void validationError(res, "ROLE_ALREADY_EXISTS", "Role already exists");
  if (parsed.data.organizationId || parsed.data.companyId) {
    const organizationId = parsed.data.organizationId ?? parsed.data.companyId;
    const organization = await prisma.company.findFirst({ where: { id: organizationId ?? "", deletedAt: null } });
    if (!organization) return void validationError(res, "ORGANIZATION_NOT_FOUND", "Organization not found");
  }
  const role = await prisma.role.create({ data: { name: parsed.data.roleName, description: parsed.data.description || null } });
  const data = mapRole(role);
  await audit(req, "CREATE_ROLE", "Role", role.id, undefined, data);
  res.status(201).json(mutationResponse("Operation completed successfully", data));
}));

router.patch("/roles/:id", asyncRoute(async (req, res) => {
  console.log("[ROLE][UPDATE]");
  const parsed = roleSchema.partial().safeParse(req.body);
  if (!parsed.success) return void validationError(res, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid role");
  const current = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!current) return void res.status(404).json(errorResponse("ROLE_NOT_FOUND", "Role not found"));
  if (parsed.data.roleName && parsed.data.roleName.toLowerCase() !== current.name.toLowerCase()) {
    const exists = await prisma.role.findFirst({ where: { name: { equals: parsed.data.roleName, mode: "insensitive" }, id: { not: current.id } } });
    if (exists) return void validationError(res, "ROLE_ALREADY_EXISTS", "Role already exists");
  }
  const role = await prisma.role.update({ where: { id: current.id }, data: { name: parsed.data.roleName, description: parsed.data.description } });
  const data = mapRole(role);
  await audit(req, "UPDATE_ROLE", "Role", role.id, mapRole(current), data);
  res.json(mutationResponse("Operation completed successfully", data));
}));

router.delete("/roles/:id", asyncRoute(async (req, res) => {
  console.log("[ROLE][DELETE]");
  const role = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!role) return void res.status(404).json(errorResponse("ROLE_NOT_FOUND", "Role not found"));
  if (isSystemRole(role.name)) return void validationError(res, "SYSTEM_ROLE_CANNOT_BE_DELETED", "System role cannot be deleted");
  const users = await prisma.user.count({ where: { roleId: role.id, deletedAt: null } });
  if (users > 0) return void validationError(res, "ROLE_HAS_USERS", "Role has assigned users");
  await prisma.role.delete({ where: { id: role.id } });
  await audit(req, "DELETE_ROLE", "Role", role.id, mapRole(role), undefined);
  res.json(mutationResponse("Operation completed successfully"));
}));

router.get("/roles/:id/permissions", asyncRoute(async (req, res) => {
  await ensurePermissions();
  const role = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!role) return void res.status(404).json(errorResponse("ROLE_NOT_FOUND", "Role not found"));
  const [all, selected] = await Promise.all([
    prisma.permission.findMany({ orderBy: { code: "asc" } }),
    prisma.rolePermission.findMany({ where: { roleId: role.id }, include: { permission: true } }),
  ]);
  res.json({
    ok: true,
    data: {
      all: all.map((item) => ({ code: item.code, name: item.name, module: item.description ?? "General" })),
      selected: selected.map((item) => item.permission.code),
    },
  });
}));

async function updateRolePermissions(req: Request, res: Response) {
  console.log("[ROLE][PERMISSIONS_UPDATE]");
  const parsed = z.object({ permissions: z.array(z.string()).optional(), permissionCodes: z.array(z.string()).optional() }).safeParse(req.body);
  if (!parsed.success) return void validationError(res, "VALIDATION_ERROR", "Invalid permission list");
  const permissionCodes = parsed.data.permissions ?? parsed.data.permissionCodes ?? [];
  await ensurePermissions();
  const role = await prisma.role.findUnique({ where: { id: req.params.id }, include: { permissions: { include: { permission: true } } } });
  if (!role) return void res.status(404).json(errorResponse("ROLE_NOT_FOUND", "Role not found"));
  const permissions = await prisma.permission.findMany({ where: { code: { in: permissionCodes } } });
  if (permissions.length !== permissionCodes.length) return void validationError(res, "PERMISSION_NOT_ALLOWED", "One or more permissions are not allowed");
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
    ...permissions.map((permission) => prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } })),
  ]);
  await audit(req, "UPDATE_ROLE_PERMISSIONS", "Role", role.id, { permissions: role.permissions.map((item) => item.permission.code) }, { permissions: permissionCodes });
  res.json(mutationResponse("Operation completed successfully", { permissions: permissionCodes }));
}

router.patch("/roles/:id/permissions", asyncRoute(updateRolePermissions));
router.put("/roles/:id/permissions", asyncRoute(updateRolePermissions));

router.get("/users", asyncRoute(async (req, res) => {
  console.log("[USER][LIST]");
  const { page, limit } = getPage(req);
  const accountStatus = req.query.accountStatus === "true" ? "ACTIVE" : req.query.accountStatus === "false" ? "INACTIVE" : undefined;
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    email: typeof req.query.username === "string" && req.query.username ? { contains: req.query.username, mode: "insensitive" } : undefined,
    phone: typeof req.query.phoneNumber === "string" && req.query.phoneNumber ? { contains: req.query.phoneNumber, mode: "insensitive" } : undefined,
    companyId: typeof req.query.organizationId === "string" && req.query.organizationId ? req.query.organizationId : undefined,
    roleId: typeof req.query.roleId === "string" && req.query.roleId ? req.query.roleId : undefined,
    status: accountStatus as UserStatus | undefined,
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { company: true, role: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: parseSortOrder(req.query.sortOrder) },
    }),
  ]);
  res.json(listResponse(users.map((user, index) => mapUser(user, (page - 1) * limit + index + 1)), page, limit, total));
}));

router.get("/users/:id", asyncRoute(async (req, res) => {
  const user = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { company: true, role: true } });
  if (!user) return void res.status(404).json(errorResponse("USER_NOT_FOUND", "User not found"));
  res.json({ ok: true, data: mapUser(user) });
}));

router.post("/users", asyncRoute(async (req, res) => {
  console.log("[USER][CREATE]");
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return void validationError(res, parsed.error.issues[0]?.path.includes("password") ? "INVALID_PASSWORD" : "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid user");
  const organization = await prisma.company.findFirst({ where: { id: parsed.data.organizationId, deletedAt: null } });
  if (!organization) return void validationError(res, "ORGANIZATION_NOT_FOUND", "Organization not found");
  const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
  if (!role) return void validationError(res, "ROLE_NOT_FOUND", "Role not found");
  const loginIdentifier = parsed.data.email || parsed.data.username;
  const exists = await prisma.user.findFirst({ where: { email: { equals: loginIdentifier, mode: "insensitive" }, deletedAt: null } });
  if (exists) return void validationError(res, "USERNAME_ALREADY_EXISTS", "Username already exists");
  const user = await prisma.user.create({
    data: {
      email: loginIdentifier,
      name: parsed.data.nickname || parsed.data.username,
      phone: parsed.data.phoneNumber ?? parsed.data.phone ?? null,
      companyId: organization.id,
      roleId: role.id,
      status: parsed.data.accountStatus ? "ACTIVE" : "INACTIVE",
      passwordHash: await hashPassword(parsed.data.password),
    },
    include: { company: true, role: true },
  });
  const data = mapUser(user);
  await audit(req, "CREATE_USER", "User", user.id, undefined, data);
  res.status(201).json(mutationResponse("Operation completed successfully", data));
}));

router.patch("/users/:id", asyncRoute(async (req, res) => {
  console.log("[USER][UPDATE]");
  const parsed = userSchema.partial().safeParse(req.body);
  if (!parsed.success) return void validationError(res, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid user");
  const current = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { company: true, role: true } });
  if (!current) return void res.status(404).json(errorResponse("USER_NOT_FOUND", "User not found"));
  const organizationId = parsed.data.organizationId ?? parsed.data.companyId ?? undefined;
  if (organizationId) {
    const organization = await prisma.company.findFirst({ where: { id: organizationId, deletedAt: null } });
    if (!organization) return void validationError(res, "ORGANIZATION_NOT_FOUND", "Organization not found");
  }
  if (parsed.data.roleId) {
    const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
    if (!role) return void validationError(res, "ROLE_NOT_FOUND", "Role not found");
  }
  const loginIdentifier = parsed.data.email || parsed.data.username;
  if (loginIdentifier && loginIdentifier.toLowerCase() !== current.email.toLowerCase()) {
    const exists = await prisma.user.findFirst({ where: { email: { equals: loginIdentifier, mode: "insensitive" }, deletedAt: null, id: { not: current.id } } });
    if (exists) return void validationError(res, "USERNAME_ALREADY_EXISTS", "Username already exists");
  }
  const user = await prisma.user.update({
    where: { id: current.id },
    data: {
      email: loginIdentifier,
      name: parsed.data.nickname ?? undefined,
      phone: parsed.data.phoneNumber ?? parsed.data.phone,
      companyId: organizationId,
      roleId: parsed.data.roleId,
      status: typeof parsed.data.accountStatus === "boolean" ? (parsed.data.accountStatus ? "ACTIVE" : "INACTIVE") : undefined,
    },
    include: { company: true, role: true },
  });
  const data = mapUser(user);
  await audit(req, "UPDATE_USER", "User", user.id, mapUser(current), data);
  res.json(mutationResponse("Operation completed successfully", data));
}));

async function ensureCanDisableOrDelete(req: Request, userId: string, action: "disable" | "delete") {
  if (req.user?.id === userId && action === "delete") return "CANNOT_DELETE_SELF";
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, include: { role: true } });
  if (!user) return "USER_NOT_FOUND";
  if (!isAdminRole(user.role?.name)) return null;
  const activeAdmins = await prisma.user.count({ where: { deletedAt: null, status: "ACTIVE", role: { name: { contains: "admin", mode: "insensitive" } } } });
  if (activeAdmins <= 1) return "CANNOT_DISABLE_LAST_ADMIN";
  return null;
}

router.patch("/users/:id/status", asyncRoute(async (req, res) => {
  console.log("[USER][STATUS_UPDATE]");
  const parsed = z.object({ accountStatus: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return void validationError(res, "VALIDATION_ERROR", "Invalid account status");
  const blockCode = parsed.data.accountStatus ? null : await ensureCanDisableOrDelete(req, req.params.id, "disable");
  if (blockCode) return void validationError(res, blockCode, blockCode === "USER_NOT_FOUND" ? "User not found" : "Cannot disable last active administrator");
  const before = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { company: true, role: true } });
  if (!before) return void res.status(404).json(errorResponse("USER_NOT_FOUND", "User not found"));
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: parsed.data.accountStatus ? "ACTIVE" : "INACTIVE" }, include: { company: true, role: true } });
  await audit(req, "UPDATE_ACCOUNT_STATUS", "User", user.id, mapUser(before), mapUser(user));
  res.json(mutationResponse("Operation completed successfully", mapUser(user)));
}));

router.patch("/users/:id/change-password", asyncRoute(async (req, res) => {
  console.log("[USER][CHANGE_PASSWORD]", { userId: req.params.id });
  const normalized = { ...req.body, newPassword: req.body.newPassword ?? req.body.password };
  const parsed = passwordSchema.safeParse(normalized);
  if (!parsed.success) return void validationError(res, "INVALID_PASSWORD", parsed.error.issues[0]?.message ?? "Invalid password");
  if (req.body.confirmPassword && parsed.data.newPassword !== req.body.confirmPassword) return void validationError(res, "INVALID_PASSWORD", "Passwords do not match");
  const user = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!user) return void res.status(404).json(errorResponse("USER_NOT_FOUND", "User not found"));
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  await audit(req, "CHANGE_PASSWORD", "User", user.id, undefined, { userId: user.id });
  res.json({ ok: true, message: "Password changed successfully" });
}));

router.post("/users/:id/change-password", asyncRoute(async (req, res) => {
  req.body = { ...req.body, newPassword: req.body.newPassword ?? req.body.password };
  await (router.stack.find(() => false), Promise.resolve());
  const normalized = { ...req.body, newPassword: req.body.newPassword ?? req.body.password };
  const parsed = passwordSchema.safeParse(normalized);
  if (!parsed.success) return void validationError(res, "INVALID_PASSWORD", parsed.error.issues[0]?.message ?? "Invalid password");
  if (req.body.confirmPassword && parsed.data.newPassword !== req.body.confirmPassword) return void validationError(res, "INVALID_PASSWORD", "Passwords do not match");
  const user = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!user) return void res.status(404).json(errorResponse("USER_NOT_FOUND", "User not found"));
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  await audit(req, "CHANGE_PASSWORD", "User", user.id, undefined, { userId: user.id });
  res.json({ ok: true, message: "Password changed successfully" });
}));

router.delete("/users/:id", asyncRoute(async (req, res) => {
  console.log("[USER][DELETE]");
  const blockCode = await ensureCanDisableOrDelete(req, req.params.id, "delete");
  if (blockCode) {
    const message = blockCode === "USER_NOT_FOUND" ? "User not found" : blockCode === "CANNOT_DELETE_SELF" ? "Cannot delete authenticated user" : "Cannot delete last active administrator";
    return void validationError(res, blockCode, message);
  }
  const before = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { company: true, role: true } });
  if (!before) return void res.status(404).json(errorResponse("USER_NOT_FOUND", "User not found"));
  const deleted = await prisma.user.update({ where: { id: before.id }, data: { deletedAt: new Date(), status: "INACTIVE" }, include: { company: true, role: true } });
  await audit(req, "DELETE_USER", "User", deleted.id, mapUser(before), { softDeleted: true });
  res.json(mutationResponse("Operation completed successfully"));
}));

router.post("/users/:id/enable", asyncRoute(async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: "ACTIVE" }, include: { company: true, role: true } });
  res.json(mutationResponse("Operation completed successfully", mapUser(user)));
}));

router.post("/users/:id/disable", asyncRoute(async (req, res) => {
  const blockCode = await ensureCanDisableOrDelete(req, req.params.id, "disable");
  if (blockCode) return void validationError(res, blockCode, "Cannot disable user");
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: "INACTIVE" }, include: { company: true, role: true } });
  res.json(mutationResponse("Operation completed successfully", mapUser(user)));
}));

export default router;
