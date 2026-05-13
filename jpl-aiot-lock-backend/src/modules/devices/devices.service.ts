import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createAuditLog } from "../audit/audit.service";
import type { CreateDeviceInput, DeviceFiltersInput, UpdateDeviceInput } from "./devices.schemas";

type DeviceRow = Prisma.DeviceGetPayload<Record<string, never>>;
type AppError = Error & { statusCode?: number; code?: string };

const MOCK_COMPANY = { id: "company_001", name: "JPL Servicios Integrales LTDA" };
const DEVICE_STATUSES = ["ONLINE", "OFFLINE", "SLEEP", "DORMANT", "UNKNOWN", "DELETED"];
const DEVICE_TYPES = ["G_Lock"];
const PRODUCT_MODELS = ["G300N"];
const MOCK_CREATED_AT = new Date("2024-10-26T09:06:51.000Z").toISOString();
const MOCK_IDS = [
  "708049716934",
  "708049716975",
  "553071201392",
  "553071201434",
  "553071201327",
  "553071201426",
  "553071207688",
  "553071207704",
  "553071207761",
  "553071207746",
  "553071200634",
];
const MOCK_NAMES = [
  "1-632-EM-001-A793-E",
  "G300N24CL10444",
  "G300N24CL10445",
  "G300N24CL10446",
  "G300N24CL10447",
  "G300N24CL10448",
  "G300N24CL10449",
  "G300N24CL10450",
  "G300N24CL10451",
  "G300N24CL10452",
  "G300N24CL10453",
];

function appError(code: string, message: string, statusCode = 400): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function normalizeStatus(status?: string | null) {
  if (!status) return "UNKNOWN";
  return status === "DORMANT" ? "DORMANT" : status;
}

function normalizeDeviceName(data: CreateDeviceInput | UpdateDeviceInput) {
  const value = data.deviceName ?? data.name;
  return value?.trim() || undefined;
}

function normalizeCompanyId(data: CreateDeviceInput | UpdateDeviceInput) {
  return data.affiliatedCompanyId ?? data.companyId;
}

function normalizeIccid(data: CreateDeviceInput | UpdateDeviceInput) {
  return data.simIccid ?? data.iccid;
}

function normalizePhone(data: CreateDeviceInput | UpdateDeviceInput) {
  return data.phoneNumber ?? data.simNumber;
}

function normalizeDescription(data: CreateDeviceInput | UpdateDeviceInput) {
  return data.description ?? data.notes;
}

function mapDevice(data: DeviceRow, companyName?: string | null, sortNo?: number) {
  const status = normalizeStatus(data.onlineStatus);
  return {
    id: data.id,
    sortNo,
    deviceName: data.name || `${data.productModel}${data.deviceId}`,
    name: data.name,
    deviceId: data.deviceId,
    imei: data.imei ?? data.deviceId,
    deviceType: data.deviceType,
    type: data.deviceType,
    productModel: data.productModel,
    affiliatedCompanyId: data.companyId,
    affiliatedCompany: companyName ?? "—",
    status,
    onlineStatus: status,
    connectionStatus: status === "DORMANT" ? "SLEEP" : status,
    lastSeenAt: data.lastConnectionAt,
    batteryLevel: data.batteryLevel,
    signalLevel: data.signalStrength,
    signalStrength: data.signalStrength,
    simIccid: data.iccid,
    iccid: data.iccid,
    phoneNumber: data.simNumber,
    simNumber: data.simNumber,
    firmwareVersion: data.firmwareVersion,
    hardwareVersion: data.hardwareVersion,
    description: data.notes,
    notes: data.notes,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function mockDevices() {
  return Array.from({ length: 522 }, (_, index) => {
    const sourceIndex = index % MOCK_IDS.length;
    const suffix = index < MOCK_IDS.length ? "" : String(index + 1).padStart(3, "0");
    const deviceId = `${MOCK_IDS[sourceIndex]}${suffix}`;
    return {
      id: `mock_device_${String(index + 1).padStart(3, "0")}`,
      sortNo: index + 1,
      deviceName: index < MOCK_NAMES.length ? MOCK_NAMES[index] : `G300N24CL${String(10444 + index).padStart(5, "0")}`,
      name: index < MOCK_NAMES.length ? MOCK_NAMES[index] : `G300N24CL${String(10444 + index).padStart(5, "0")}`,
      deviceId,
      imei: deviceId,
      deviceType: "G_Lock",
      type: "G_Lock",
      productModel: "G300N",
      affiliatedCompanyId: MOCK_COMPANY.id,
      affiliatedCompany: MOCK_COMPANY.name,
      status: "OFFLINE",
      onlineStatus: "OFFLINE",
      connectionStatus: "OFFLINE",
      lastSeenAt: null,
      batteryLevel: null,
      signalLevel: null,
      signalStrength: null,
      simIccid: null,
      iccid: null,
      phoneNumber: null,
      simNumber: null,
      firmwareVersion: null,
      hardwareVersion: null,
      description: "Mock backend device ready for real inventory integration.",
      notes: "Mock backend device ready for real inventory integration.",
      createdAt: MOCK_CREATED_AT,
      updatedAt: MOCK_CREATED_AT,
    };
  });
}

let mockDeviceCache: ReturnType<typeof mockDevices> | null = null;

function controlledMockDevices() {
  if (!mockDeviceCache) mockDeviceCache = mockDevices();
  return mockDeviceCache;
}

function applyMockFilters(devices: ReturnType<typeof mockDevices>, filters: DeviceFiltersInput) {
  const text = (value?: string | null) => (value ?? "").toLowerCase();
  return devices.filter((device) => {
    if (filters.deviceType && device.deviceType !== filters.deviceType) return false;
    if (filters.productModel && device.productModel !== filters.productModel) return false;
    if (filters.status && device.status !== filters.status) return false;
    if (filters.affiliatedCompanyId && device.affiliatedCompanyId !== filters.affiliatedCompanyId) return false;
    if (filters.companyId && device.affiliatedCompanyId !== filters.companyId) return false;
    if (filters.deviceId && !text(device.deviceId).includes(text(filters.deviceId))) return false;
    if (filters.deviceName && !text(device.deviceName).includes(text(filters.deviceName))) return false;
    return true;
  });
}

async function companyNameMap(companyIds: Array<string | null>) {
  const ids = Array.from(new Set(companyIds.filter((id): id is string => Boolean(id))));
  const companies = ids.length ? await prisma.company.findMany({ where: { id: { in: ids } } }) : [];
  return new Map(companies.map((company) => [company.id, company.name]));
}

async function ensureCompany(companyId?: string) {
  if (!companyId) throw appError("COMPANY_NOT_FOUND", "Affiliated company is required");
  if (companyId === MOCK_COMPANY.id) return;
  const exists = await prisma.company.findFirst({ where: { id: companyId, deletedAt: null }, select: { id: true } });
  if (!exists) throw appError("COMPANY_NOT_FOUND", "Company not found", 404);
}

function deviceWhere(filters?: DeviceFiltersInput): Prisma.DeviceWhereInput {
  const search = filters?.search?.trim();
  const companyId = filters?.affiliatedCompanyId ?? filters?.companyId ?? filters?.affiliatedCompany;
  return {
    deletedAt: null,
    deviceType: filters?.deviceType || undefined,
    productModel: filters?.productModel || undefined,
    companyId: companyId || undefined,
    onlineStatus: filters?.status && filters.status !== "DELETED" ? filters.status : undefined,
    status: filters?.status === "DELETED" ? "DELETED" : undefined,
    deviceId: filters?.deviceId ? { contains: filters.deviceId, mode: "insensitive" } : undefined,
    name: filters?.deviceName ? { contains: filters.deviceName, mode: "insensitive" } : undefined,
    OR: search
      ? [
          { deviceId: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { productModel: { contains: search, mode: "insensitive" } },
        ]
      : undefined,
  };
}

function orderBy(filters?: DeviceFiltersInput): Prisma.DeviceOrderByWithRelationInput {
  const direction = (filters?.sortOrder ?? "desc").toLowerCase() as "asc" | "desc";
  if (filters?.sortBy === "deviceName") return { name: direction };
  if (filters?.sortBy === "deviceId") return { deviceId: direction };
  if (filters?.sortBy === "status") return { onlineStatus: direction };
  return { createdAt: direction };
}

function audit(actorId: string | undefined, description: string, entityId?: string, values?: Prisma.InputJsonValue) {
  return createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.SYSTEM_EVENT,
    entity: "Device",
    entityId,
    description,
    newValues: values,
  }).catch(() => undefined);
}

export async function listDevices(filters: DeviceFiltersInput) {
  console.log("[DEVICE][LIST]", { page: filters.page, limit: filters.limit, sortBy: filters.sortBy });
  const where = deviceWhere(filters);
  const [baseTotal, total] = await Promise.all([
    prisma.device.count({ where: { deletedAt: null } }),
    prisma.device.count({ where }),
  ]);

  if (baseTotal === 0) {
    const filtered = applyMockFilters(controlledMockDevices(), filters);
    const start = (filters.page - 1) * filters.limit;
    const data = filtered.slice(start, start + filters.limit).map((device, index) => ({ ...device, sortNo: start + index + 1 }));
    return { data, pagination: { page: filters.page, limit: filters.limit, total: filtered.length, totalPages: Math.ceil(filtered.length / filters.limit) } };
  }

  const devices = await prisma.device.findMany({
    where,
    orderBy: orderBy(filters),
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  });
  const companies = await companyNameMap(devices.map((device) => device.companyId));
  const start = (filters.page - 1) * filters.limit;
  const data = devices.map((device, index) => mapDevice(device, companies.get(device.companyId ?? "") ?? null, start + index + 1));
  return { data, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function getDeviceSummary(filters: DeviceFiltersInput) {
  console.log("[DEVICE][SUMMARY]");
  const where = deviceWhere(filters);
  const [baseTotal, total] = await Promise.all([
    prisma.device.count({ where: { deletedAt: null } }),
    prisma.device.count({ where }),
  ]);
  if (baseTotal === 0) {
    const filtered = applyMockFilters(controlledMockDevices(), filters);
    const totalMock = filtered.length;
    const offlineMock = filtered.filter((device) => device.status === "OFFLINE").length;
    const onlineMock = filtered.filter((device) => device.status === "ONLINE").length;
    const dormantMock = filtered.filter((device) => device.status === "DORMANT" || device.status === "SLEEP").length;
    return { total: totalMock, online: onlineMock, offline: offlineMock, sleep: 0, dormant: dormantMock, totalNumber: totalMock, totalOnline: onlineMock, totalOffline: offlineMock, dormantCount: dormantMock };
  }
  const [online, offline, sleep, dormant] = await Promise.all([
    prisma.device.count({ where: { ...where, onlineStatus: "ONLINE" } }),
    prisma.device.count({ where: { ...where, onlineStatus: "OFFLINE" } }),
    prisma.device.count({ where: { ...where, onlineStatus: "SLEEP" } }),
    prisma.device.count({ where: { ...where, onlineStatus: "DORMANT" } }),
  ]);
  return { total, online, offline, sleep, dormant: dormant + sleep, totalNumber: total, totalOnline: online, totalOffline: offline, dormantCount: dormant + sleep };
}

export async function getDeviceOptions() {
  console.log("[DEVICE][OPTIONS]");
  const [types, models, companies] = await Promise.all([
    prisma.device.findMany({ where: { deletedAt: null }, distinct: ["deviceType"], select: { deviceType: true } }),
    prisma.device.findMany({ where: { deletedAt: null }, distinct: ["productModel"], select: { productModel: true } }),
    prisma.company.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    deviceTypes: types.map((item) => item.deviceType).filter(Boolean).length ? types.map((item) => item.deviceType).filter(Boolean) : DEVICE_TYPES,
    productModels: models.map((item) => item.productModel).filter(Boolean).length ? models.map((item) => item.productModel).filter(Boolean) : PRODUCT_MODELS,
    statuses: DEVICE_STATUSES,
    companies: companies.length ? companies : [MOCK_COMPANY],
  };
}

export async function getDeviceById(id: string) {
  console.log("[DEVICE][DETAIL]", { id });
  const device = await prisma.device.findFirst({ where: { deletedAt: null, OR: [{ id }, { deviceId: id }] } });
  if (!device) {
    const mock = controlledMockDevices().find((item) => item.id === id || item.deviceId === id);
    if (mock) return mock;
    throw appError("DEVICE_NOT_FOUND", "Device not found", 404);
  }
  const companies = await companyNameMap([device.companyId]);
  return mapDevice(device, companies.get(device.companyId ?? "") ?? null);
}

export async function createDevice(data: CreateDeviceInput, actorId?: string) {
  console.log("[DEVICE][CREATE_REQUEST]", { deviceId: data.deviceId });
  const companyId = normalizeCompanyId(data);
  await ensureCompany(companyId);
  if (controlledMockDevices().some((device) => device.deviceId === data.deviceId)) {
    console.log("[DEVICE][CREATE_FAILED]", { code: "DEVICE_ALREADY_EXISTS" });
    throw appError("DEVICE_ALREADY_EXISTS", "Device already exists", 409);
  }
  const duplicate = await prisma.device.findFirst({ where: { deletedAt: null, deviceId: data.deviceId } });
  if (duplicate) {
    console.log("[DEVICE][CREATE_FAILED]", { code: "DEVICE_ALREADY_EXISTS" });
    throw appError("DEVICE_ALREADY_EXISTS", "Device already exists", 409);
  }
  const deviceName = normalizeDeviceName(data) ?? `${data.productModel}${data.deviceId}`;
  const device = await prisma.device.create({
    data: {
      deviceId: data.deviceId,
      name: deviceName,
      deviceType: data.deviceType,
      productModel: data.productModel,
      companyId,
      imei: data.imei || data.deviceId,
      serialNumber: data.serialNumber || null,
      simNumber: normalizePhone(data) || null,
      iccid: normalizeIccid(data) || null,
      firmwareVersion: data.firmwareVersion || null,
      hardwareVersion: data.hardwareVersion || null,
      bluetoothName: data.bluetoothName || null,
      notes: normalizeDescription(data) || null,
      onlineStatus: "OFFLINE",
    },
  });
  await audit(actorId, "DEVICE_CREATED", device.id, { deviceId: device.deviceId });
  console.log("[DEVICE][CREATE_SUCCESS]", { id: device.id });
  return { id: device.id };
}

export async function batchCreateDevices(devices: CreateDeviceInput[], actorId?: string) {
  console.log("[DEVICE][BATCH_CREATE_REQUEST]", { rows: devices.length });
  const errors: Array<{ row: number; deviceId?: string; message: string }> = [];
  const seen = new Set<string>();
  let created = 0;
  for (const [index, device] of devices.entries()) {
    if (seen.has(device.deviceId)) {
      errors.push({ row: index + 1, deviceId: device.deviceId, message: "Duplicate deviceId in import" });
      continue;
    }
    seen.add(device.deviceId);
    try {
      await createDevice(device, actorId);
      created += 1;
    } catch (error) {
      errors.push({ row: index + 1, deviceId: device.deviceId, message: error instanceof Error ? error.message : "Invalid row" });
    }
  }
  await audit(actorId, "DEVICE_BATCH_CREATED", undefined, { count: created });
  console.log("[DEVICE][BATCH_CREATE_SUCCESS]", { created, errors: errors.length });
  return { created, skipped: errors.length, errors };
}

export async function updateDevice(id: string, data: UpdateDeviceInput, actorId?: string) {
  console.log("[DEVICE][UPDATE_REQUEST]", { id });
  const current = await prisma.device.findFirst({ where: { deletedAt: null, OR: [{ id }, { deviceId: id }] } });
  if (!current) {
    const mock = controlledMockDevices().find((item) => item.id === id || item.deviceId === id);
    if (!mock) throw appError("DEVICE_NOT_FOUND", "Device not found", 404);
    Object.assign(mock, {
      deviceName: normalizeDeviceName(data) ?? mock.deviceName,
      name: normalizeDeviceName(data) ?? mock.name,
      deviceType: data.deviceType ?? mock.deviceType,
      type: data.deviceType ?? mock.type,
      productModel: data.productModel ?? mock.productModel,
      affiliatedCompanyId: normalizeCompanyId(data) ?? mock.affiliatedCompanyId,
      simIccid: normalizeIccid(data) ?? mock.simIccid,
      iccid: normalizeIccid(data) ?? mock.iccid,
      phoneNumber: normalizePhone(data) ?? mock.phoneNumber,
      simNumber: normalizePhone(data) ?? mock.simNumber,
      description: normalizeDescription(data) ?? mock.description,
      notes: normalizeDescription(data) ?? mock.notes,
      onlineStatus: data.onlineStatus ?? mock.onlineStatus,
      status: data.onlineStatus ?? data.status ?? mock.status,
      updatedAt: new Date().toISOString(),
    });
    await audit(actorId, "DEVICE_UPDATED_MOCK", mock.id, { after: mock as Prisma.InputJsonValue });
    console.log("[DEVICE][UPDATE_SUCCESS]", { id: mock.id, source: "mock" });
    return mock;
  }
  if (data.deviceId && data.deviceId !== current.deviceId) {
    const duplicate = await prisma.device.findFirst({ where: { deletedAt: null, deviceId: data.deviceId } });
    if (duplicate) throw appError("DEVICE_ALREADY_EXISTS", "Device already exists", 409);
  }
  if (normalizeCompanyId(data)) await ensureCompany(normalizeCompanyId(data));
  const updated = await prisma.device.update({
    where: { id: current.id },
    data: {
      deviceId: data.deviceId,
      name: normalizeDeviceName(data),
      deviceType: data.deviceType,
      productModel: data.productModel,
      companyId: normalizeCompanyId(data),
      imei: data.imei,
      serialNumber: data.serialNumber,
      simNumber: normalizePhone(data),
      iccid: normalizeIccid(data),
      firmwareVersion: data.firmwareVersion,
      hardwareVersion: data.hardwareVersion,
      bluetoothName: data.bluetoothName,
      notes: normalizeDescription(data),
      onlineStatus: data.onlineStatus,
      status: data.status,
    },
  });
  await audit(actorId, "DEVICE_UPDATED", updated.id, { before: current as unknown as Prisma.InputJsonValue, after: updated as unknown as Prisma.InputJsonValue });
  console.log("[DEVICE][UPDATE_SUCCESS]", { id: updated.id });
  return getDeviceById(updated.id);
}

export async function batchModifyDevices(deviceIds: string[], updates: UpdateDeviceInput, actorId?: string) {
  console.log("[DEVICE][BATCH_UPDATE_REQUEST]", { count: deviceIds.length });
  if (!deviceIds.length) throw appError("NO_DEVICES_SELECTED", "No devices selected");
  if (normalizeCompanyId(updates)) await ensureCompany(normalizeCompanyId(updates));
  const result = await prisma.device.updateMany({
    where: { deletedAt: null, OR: [{ id: { in: deviceIds } }, { deviceId: { in: deviceIds } }] },
    data: {
      name: normalizeDeviceName(updates),
      deviceType: updates.deviceType,
      productModel: updates.productModel,
      companyId: normalizeCompanyId(updates),
      onlineStatus: updates.onlineStatus,
      notes: normalizeDescription(updates),
    },
  });
  if (result.count === 0) {
    let updated = 0;
    for (const mock of controlledMockDevices()) {
      if (!deviceIds.includes(mock.id) && !deviceIds.includes(mock.deviceId)) continue;
      Object.assign(mock, {
        deviceName: normalizeDeviceName(updates) ?? mock.deviceName,
        name: normalizeDeviceName(updates) ?? mock.name,
        deviceType: updates.deviceType ?? mock.deviceType,
        type: updates.deviceType ?? mock.type,
        productModel: updates.productModel ?? mock.productModel,
        affiliatedCompanyId: normalizeCompanyId(updates) ?? mock.affiliatedCompanyId,
        onlineStatus: updates.onlineStatus ?? mock.onlineStatus,
        status: updates.onlineStatus ?? updates.status ?? mock.status,
        description: normalizeDescription(updates) ?? mock.description,
        notes: normalizeDescription(updates) ?? mock.notes,
        updatedAt: new Date().toISOString(),
      });
      updated += 1;
    }
    await audit(actorId, "DEVICE_BATCH_UPDATED_MOCK", undefined, { affectedDeviceIds: deviceIds, updates });
    return { updated };
  }
  await audit(actorId, "DEVICE_BATCH_UPDATED", undefined, { affectedDeviceIds: deviceIds, updates });
  return { updated: result.count };
}

export async function batchAssignCompany(deviceIds: string[], companyId: string, remarks: string | null | undefined, actorId?: string) {
  console.log("[DEVICE][BATCH_ASSIGN_COMPANY]", { count: deviceIds.length, companyId });
  if (!deviceIds.length) throw appError("NO_DEVICES_SELECTED", "No devices selected");
  await ensureCompany(companyId);
  const devices = await prisma.device.findMany({ where: { deletedAt: null, OR: [{ id: { in: deviceIds } }, { deviceId: { in: deviceIds } }] } });
  if (devices.length === 0) {
    let assigned = 0;
    for (const mock of controlledMockDevices()) {
      if (!deviceIds.includes(mock.id) && !deviceIds.includes(mock.deviceId)) continue;
      mock.affiliatedCompanyId = companyId;
      mock.affiliatedCompany = companyId === MOCK_COMPANY.id ? MOCK_COMPANY.name : companyId;
      mock.updatedAt = new Date().toISOString();
      assigned += 1;
    }
    await audit(actorId, "DEVICE_COMPANY_ASSIGNED_MOCK", undefined, { affectedDeviceIds: deviceIds, companyId });
    return { assigned };
  }
  await prisma.$transaction([
    ...devices.map((device) =>
      prisma.deviceCompanyAssignmentHistory.create({
        data: { deviceId: device.deviceId, fromCompanyId: device.companyId, toCompanyId: companyId, remarks: remarks ?? undefined, assignedById: actorId },
      }),
    ),
    prisma.device.updateMany({ where: { id: { in: devices.map((device) => device.id) } }, data: { companyId } }),
  ]);
  await audit(actorId, "DEVICE_COMPANY_ASSIGNED", undefined, { affectedDeviceIds: deviceIds, companyId });
  return { assigned: devices.length };
}

export async function deleteDevice(id: string, actorId?: string) {
  console.log("[DEVICE][DELETE_REQUEST]", { id });
  const current = await prisma.device.findFirst({ where: { deletedAt: null, OR: [{ id }, { deviceId: id }] } });
  if (!current) {
    const index = controlledMockDevices().findIndex((item) => item.id === id || item.deviceId === id);
    if (index === -1) throw appError("DEVICE_NOT_FOUND", "Device not found", 404);
    const [deleted] = controlledMockDevices().splice(index, 1);
    await audit(actorId, "DEVICE_DELETED_MOCK", deleted.id, { before: deleted as Prisma.InputJsonValue });
    console.log("[DEVICE][DELETE_SUCCESS]", { id: deleted.id, source: "mock" });
    return { deleted: 1 };
  }
  const activeOta = await prisma.otaUpgradeRecord.count({
    where: { deviceId: current.deviceId, status: { in: ["PENDING", "SENDING", "UPDATING", "WAITING_REBOOT"] } },
  });
  if (activeOta > 0) throw appError("DEVICE_HAS_ACTIVE_OPERATIONS", "Device has active OTA records", 409);
  const deleted = await prisma.device.update({ where: { id: current.id }, data: { deletedAt: new Date(), status: "DELETED", onlineStatus: "OFFLINE" } });
  await audit(actorId, "DEVICE_DELETED", deleted.id, { before: current as unknown as Prisma.InputJsonValue });
  console.log("[DEVICE][DELETE_SUCCESS]", { id: deleted.id });
  return { deleted: 1 };
}

export async function batchDeleteDevices(deviceIds: string[], actorId?: string) {
  if (!deviceIds.length) throw appError("NO_DEVICES_SELECTED", "No devices selected");
  let deleted = 0;
  for (const id of deviceIds) {
    const result = await deleteDevice(id, actorId);
    deleted += result.deleted;
  }
  await audit(actorId, "DEVICE_BATCH_DELETED", undefined, { affectedDeviceIds: deviceIds });
  return { deleted };
}

export async function getSlaveDevices(id: string) {
  await getDeviceById(id);
  return [];
}

export async function setBatchAlarmPolicy(input: {
  deviceIds: string[];
  receivePhones?: string | null;
  receiveEmails?: string | null;
  pushTypes: Array<"SMS" | "EMAIL">;
  sendingEventTypes: string[];
  enabled: boolean;
  remarks?: string | null;
}, actorId?: string) {
  const devices = await prisma.device.findMany({ where: { deletedAt: null, OR: [{ id: { in: input.deviceIds } }, { deviceId: { in: input.deviceIds } }] } });
  const result = await prisma.$transaction(
    devices.map((device) =>
      prisma.deviceAlarmPolicy.create({
        data: {
          deviceId: device.deviceId,
          receivePhones: input.receivePhones ?? null,
          receiveEmails: input.receiveEmails ?? null,
          pushSmsEnabled: input.pushTypes.includes("SMS"),
          pushEmailEnabled: input.pushTypes.includes("EMAIL"),
          sendingEventTypes: input.sendingEventTypes.join(","),
          enabled: input.enabled,
          remarks: input.remarks ?? null,
          createdById: actorId,
        },
      }),
    ),
  );
  await audit(actorId, "DEVICE_ALARM_POLICY_UPDATED", undefined, { affectedDeviceIds: devices.map((device) => device.deviceId) });
  return { ok: true, count: result.length };
}

export function listAlarmStrategy(deviceId: string) {
  return prisma.deviceAlarmPolicy.findMany({ where: { deviceId }, orderBy: { createdAt: "desc" } });
}

export async function exportDevices(filters: DeviceFiltersInput, deviceIds: string[] | undefined, actorId?: string) {
  console.log("[DEVICE][EXPORT_REQUEST]", { selected: deviceIds?.length ?? 0 });
  const pageSize = 100;
  const firstPage = await listDevices({ ...filters, page: 1, limit: pageSize });
  const allDevices = [...firstPage.data];
  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const nextPage = await listDevices({ ...filters, page, limit: pageSize });
    allDevices.push(...nextPage.data);
  }
  const source = deviceIds?.length ? allDevices.filter((device) => deviceIds.includes(device.id) || deviceIds.includes(device.deviceId)) : allDevices;
  const header = ["Sort No.", "Device name", "Device ID", "Device type", "Product model", "Affiliated company", "Status", "Create time", "Description"];
  const rows = source.map((device, index) => [
    device.sortNo ?? index + 1,
    device.deviceName,
    device.deviceId,
    device.deviceType,
    device.productModel,
    device.affiliatedCompany,
    device.status,
    new Date(device.createdAt).toISOString(),
    device.description ?? "",
  ]);
  await audit(actorId, "DEVICE_EXPORTED", undefined, { count: source.length });
  console.log("[DEVICE][EXPORT_SUCCESS]", { count: source.length });
  return [header, ...rows].map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}
