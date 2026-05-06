import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createAuditLog } from "../audit/audit.service";
import type { CreateDeviceInput, DeviceFiltersInput, UpdateDeviceInput } from "./devices.schemas";

function normalizeDeviceName(data: CreateDeviceInput | UpdateDeviceInput) {
  return data.deviceName ?? data.name;
}

function normalizeCompanyId(data: CreateDeviceInput | UpdateDeviceInput) {
  return data.affiliatedCompanyId ?? data.companyId;
}

function mapDevice(data: Prisma.DeviceGetPayload<Record<string, never>>, companyName?: string | null) {
  return {
    ...data,
    deviceName: data.name,
    internalCode: data.deviceId,
    type: data.deviceType,
    affiliatedCompanyId: data.companyId,
    affiliatedCompany: companyName ?? null,
    connectionStatus: data.onlineStatus === "DORMANT" ? "SLEEP" : data.onlineStatus,
    connectionType: "IOT",
    signalLevel: data.signalStrength,
    latitude: data.lastLocationLat,
    longitude: data.lastLocationLng,
    lastSyncAt: data.lastConnectionAt,
  };
}

async function companyNameMap(companyIds: Array<string | null>) {
  const ids = Array.from(new Set(companyIds.filter((id): id is string => Boolean(id))));
  const companies = ids.length ? await prisma.company.findMany({ where: { id: { in: ids } } }) : [];
  return new Map(companies.map((company) => [company.id, company.name]));
}

function deviceWhere(filters?: DeviceFiltersInput): Prisma.DeviceWhereInput {
  const search = filters?.search?.trim();
  return {
    deletedAt: null,
    deviceType: filters?.deviceType || undefined,
    productModel: filters?.productModel || undefined,
    companyId: filters?.companyId || filters?.affiliatedCompany || undefined,
    onlineStatus: filters?.status || undefined,
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

function audit(actorId: string | undefined, description: string, entityId?: string, newValues?: Prisma.InputJsonValue) {
  return createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.SYSTEM_EVENT,
    entity: "Device",
    entityId,
    description,
    newValues,
  }).catch(() => undefined);
}

export async function listDevices(filters?: DeviceFiltersInput) {
  const devices = await prisma.device.findMany({ where: deviceWhere(filters), orderBy: { createdAt: "desc" } });
  const companies = await companyNameMap(devices.map((device) => device.companyId));
  return devices.map((device) => mapDevice(device, companies.get(device.companyId ?? "") ?? null));
}

export async function getDeviceById(id: string) {
  const device = await prisma.device.findFirstOrThrow({
    where: { deletedAt: null, OR: [{ id }, { deviceId: id }] },
  });
  const companies = await companyNameMap([device.companyId]);
  return mapDevice(device, companies.get(device.companyId ?? "") ?? null);
}

export async function getDeviceSummary(filters?: DeviceFiltersInput) {
  const where = deviceWhere(filters);
  const [total, online, offline, dormant] = await Promise.all([
    prisma.device.count({ where }),
    prisma.device.count({ where: { ...where, onlineStatus: "ONLINE" } }),
    prisma.device.count({ where: { ...where, onlineStatus: "OFFLINE" } }),
    prisma.device.count({ where: { ...where, onlineStatus: "DORMANT" } }),
  ]);
  return { totalNumber: total, totalOnline: online, totalOffline: offline, dormantCount: dormant };
}

export async function createDevice(data: CreateDeviceInput, actorId?: string) {
  const duplicate = await prisma.device.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { deviceId: data.deviceId },
        ...(data.imei ? [{ imei: data.imei }] : []),
        ...(data.serialNumber ? [{ serialNumber: data.serialNumber }] : []),
      ],
    },
  });
  if (duplicate) throw new Error("Device ID, IMEI or serial number already exists");
  const device = await prisma.device.create({
    data: {
      deviceId: data.deviceId,
      name: normalizeDeviceName(data) ?? data.deviceId,
      deviceType: data.deviceType,
      productModel: data.productModel,
      companyId: normalizeCompanyId(data),
      imei: data.imei || null,
      serialNumber: data.serialNumber || null,
      simNumber: data.simNumber || null,
      iccid: data.iccid || null,
      firmwareVersion: data.firmwareVersion || null,
      hardwareVersion: data.hardwareVersion || null,
      bluetoothName: data.bluetoothName || null,
      notes: data.notes || null,
      onlineStatus: "OFFLINE",
    },
  });
  await audit(actorId, "DEVICE_CREATED", device.id, { deviceId: device.deviceId });
  return getDeviceById(device.id);
}

export async function batchCreateDevices(devices: CreateDeviceInput[], actorId?: string) {
  const created = [];
  const errors: Array<{ row: number; deviceId?: string; error: string }> = [];
  const seen = new Set<string>();

  for (const [index, device] of devices.entries()) {
    if (seen.has(device.deviceId)) {
      errors.push({ row: index + 1, deviceId: device.deviceId, error: "Duplicate deviceId in file" });
      continue;
    }
    seen.add(device.deviceId);
    try {
      created.push(await createDevice(device, actorId));
    } catch (error) {
      errors.push({ row: index + 1, deviceId: device.deviceId, error: error instanceof Error ? error.message : "Invalid row" });
    }
  }

  await audit(actorId, "DEVICE_BATCH_CREATED", undefined, { count: created.length });
  return { created, errors };
}

export async function updateDevice(id: string, data: UpdateDeviceInput, actorId?: string) {
  const current = await prisma.device.findFirstOrThrow({ where: { deletedAt: null, OR: [{ id }, { deviceId: id }] } });
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
      simNumber: data.simNumber,
      iccid: data.iccid,
      firmwareVersion: data.firmwareVersion,
      hardwareVersion: data.hardwareVersion,
      bluetoothName: data.bluetoothName,
      notes: data.notes,
      onlineStatus: data.onlineStatus,
      status: data.status,
    },
  });
  await audit(actorId, "DEVICE_UPDATED", updated.id, { deviceId: updated.deviceId });
  return getDeviceById(updated.id);
}

export async function deleteDevice(id: string, actorId?: string) {
  const current = await prisma.device.findFirstOrThrow({ where: { deletedAt: null, OR: [{ id }, { deviceId: id }] } });
  const activeOta = await prisma.otaUpgradeRecord.count({
    where: { deviceId: current.deviceId, status: { in: ["PENDING", "SENDING", "UPDATING", "WAITING_REBOOT"] } },
  });
  if (activeOta > 0) throw new Error("Device has active OTA records");
  const deleted = await prisma.device.update({ where: { id: current.id }, data: { deletedAt: new Date(), status: "DELETED" } });
  await audit(actorId, "DEVICE_DELETED", deleted.id, { deviceId: deleted.deviceId });
  return { ok: true };
}

export async function batchDeleteDevices(deviceIds: string[], actorId?: string) {
  for (const id of deviceIds) await deleteDevice(id, actorId);
  await audit(actorId, "DEVICE_BATCH_DELETED", undefined, { affectedDeviceIds: deviceIds });
  return { ok: true, count: deviceIds.length };
}

export async function batchModifyDevices(deviceIds: string[], updates: UpdateDeviceInput, actorId?: string) {
  const data: Prisma.DeviceUpdateManyMutationInput = {
    name: normalizeDeviceName(updates),
    deviceType: updates.deviceType,
    productModel: updates.productModel,
    companyId: normalizeCompanyId(updates),
    status: updates.status,
    onlineStatus: updates.onlineStatus,
    notes: updates.notes,
  };
  const result = await prisma.device.updateMany({ where: { deletedAt: null, OR: [{ id: { in: deviceIds } }, { deviceId: { in: deviceIds } }] }, data });
  await audit(actorId, "DEVICE_BATCH_UPDATED", undefined, { affectedDeviceIds: deviceIds, updates });
  return { ok: true, count: result.count };
}

export async function batchAssignCompany(deviceIds: string[], companyId: string, remarks: string | null | undefined, actorId?: string) {
  const devices = await prisma.device.findMany({ where: { deletedAt: null, OR: [{ id: { in: deviceIds } }, { deviceId: { in: deviceIds } }] } });
  await prisma.$transaction([
    ...devices.map((device) =>
      prisma.deviceCompanyAssignmentHistory.create({
        data: { deviceId: device.deviceId, fromCompanyId: device.companyId, toCompanyId: companyId, remarks: remarks ?? undefined, assignedById: actorId },
      }),
    ),
    prisma.device.updateMany({ where: { id: { in: devices.map((device) => device.id) } }, data: { companyId } }),
  ]);
  await audit(actorId, "DEVICE_COMPANY_ASSIGNED", undefined, { affectedDeviceIds: deviceIds, companyId });
  return { ok: true, count: devices.length };
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

export async function exportDevices(filters: DeviceFiltersInput | undefined, deviceIds: string[] | undefined, actorId?: string) {
  const devices = deviceIds?.length
    ? await prisma.device.findMany({ where: { deletedAt: null, OR: [{ id: { in: deviceIds } }, { deviceId: { in: deviceIds } }] } })
    : await prisma.device.findMany({ where: deviceWhere(filters), orderBy: { createdAt: "desc" } });
  const companies = await companyNameMap(devices.map((device) => device.companyId));
  const header = ["Device ID", "Device name", "Device type", "Product model", "Affiliated company", "Status", "IMEI", "Serial number", "SIM", "ICCID", "Firmware version", "Last online time", "Create time"];
  const rows = devices.map((device) => [
    device.deviceId,
    device.name,
    device.deviceType,
    device.productModel,
    companies.get(device.companyId ?? "") ?? "",
    device.onlineStatus,
    device.imei ?? "",
    device.serialNumber ?? "",
    device.simNumber ?? "",
    device.iccid ?? "",
    device.firmwareVersion ?? "",
    device.lastConnectionAt?.toISOString() ?? "",
    device.createdAt.toISOString(),
  ]);
  await audit(actorId, "DEVICE_EXPORTED", undefined, { count: devices.length });
  return [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
}
