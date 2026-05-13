import { randomUUID } from "crypto";
import { prisma } from "../../../config/prisma";
import { findControlDevice, listControlDevices } from "../shared/control-device-selector.service";
import type { ParameterCommand, ParameterCommandStatus, ParameterCommandType, ParameterDevice, ParameterDeviceFilters, ParameterField, ParameterSnapshot, ParameterSnapshotSource } from "./parameter.types";

const snapshotsByDevice = new Map<string, ParameterSnapshot[]>();
const commandsByDevice = new Map<string, ParameterCommand[]>();

function prismaDelegate(name: string) {
  return (prisma as unknown as Record<string, any>)[name];
}

function normalizeStatus(status?: ParameterDeviceFilters["status"]) {
  if (!status || status === "ALL" || status === "all") return "all";
  return status.toLowerCase();
}

export function listParameterDevices(filters: ParameterDeviceFilters = {}): ParameterDevice[] {
  return listControlDevices(normalizeStatus(filters.status), filters.type ?? "AllType", filters.search ?? "")
    .flatMap((group) =>
      group.devices.map((device) => ({
        id: device.deviceId,
        name: device.name ?? device.deviceId,
        imei: device.deviceId,
        code: device.name?.match(/\[(.*)\]/)?.[1],
        type: device.model ?? device.type,
        companyName: device.companyName,
        status: device.status === "SLEEP" ? "SLEEP" : device.isOnline ? "ONLINE" : "OFFLINE",
        battery: device.status === "OFFLINE" ? 32 : device.status === "SLEEP" ? 51 : 86,
        lastSeenAt: new Date(Date.now() - (device.isOnline ? 60_000 : device.status === "SLEEP" ? 1800_000 : 7200_000)).toISOString(),
      })),
    );
}

export function findParameterDevice(deviceId: string) {
  const controlDevice = findControlDevice(deviceId);
  if (!controlDevice) return undefined;
  return listParameterDevices().find((device) => device.id === controlDevice.deviceId);
}

export async function getLatestSnapshot(deviceId: string): Promise<ParameterSnapshot | null> {
  const memory = snapshotsByDevice.get(deviceId)?.[0];
  if (memory) return memory;

  const delegate = prismaDelegate("deviceParameterSnapshot");
  if (!delegate?.findFirst) return null;

  try {
    const row = await delegate.findFirst({ where: { deviceId }, orderBy: { readAt: "desc" } });
    if (!row) return null;
    return {
      id: row.id,
      deviceId: row.deviceId,
      source: row.source ?? row.category ?? "READ",
      parameters: row.parameters,
      readAt: row.readAt.toISOString(),
      createdById: row.createdById ?? row.readById ?? undefined,
      createdAt: (row.createdAt ?? row.readAt).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveSnapshot(input: {
  deviceId: string;
  source: ParameterSnapshotSource;
  parameters: Record<string, ParameterField[]>;
  createdById?: string;
  readAt?: string;
}) {
  const now = new Date().toISOString();
  const snapshot: ParameterSnapshot = {
    id: randomUUID(),
    deviceId: input.deviceId,
    source: input.source,
    parameters: input.parameters,
    readAt: input.readAt ?? now,
    createdById: input.createdById,
    createdAt: now,
  };
  snapshotsByDevice.set(input.deviceId, [snapshot, ...(snapshotsByDevice.get(input.deviceId) ?? [])]);

  const delegate = prismaDelegate("deviceParameterSnapshot");
  if (delegate?.create) {
    try {
      await delegate.create({
        data: {
          id: snapshot.id,
          deviceId: snapshot.deviceId,
          source: snapshot.source,
          category: "all",
          parameters: snapshot.parameters,
          readById: snapshot.createdById,
          createdById: snapshot.createdById,
          readAt: new Date(snapshot.readAt),
        },
      });
    } catch {
      // The project can run without a migrated database during local UI work.
    }
  }

  console.log("[PARAMETER][SNAPSHOT_SAVED]", { deviceId: input.deviceId, source: input.source, readAt: snapshot.readAt });
  return snapshot;
}

export async function createParameterCommand(input: {
  deviceId: string;
  commandType: ParameterCommandType;
  status?: ParameterCommandStatus;
  requestedPayload?: Record<string, unknown>;
  requestedById?: string;
  reservedFor?: string;
}) {
  const now = new Date().toISOString();
  const command: ParameterCommand = {
    id: randomUUID(),
    deviceId: input.deviceId,
    commandType: input.commandType,
    status: input.status ?? "PENDING",
    requestedPayload: input.requestedPayload,
    requestedById: input.requestedById,
    requestedAt: now,
    reservedFor: input.reservedFor,
  };
  commandsByDevice.set(input.deviceId, [command, ...(commandsByDevice.get(input.deviceId) ?? [])]);

  const delegate = prismaDelegate("deviceParameterCommand");
  if (delegate?.create) {
    try {
      await delegate.create({ data: { ...command, requestedAt: new Date(command.requestedAt), reservedFor: command.reservedFor ? new Date(command.reservedFor) : undefined } });
    } catch {
      // Fallback memory store keeps command traceability for local/mock mode.
    }
  }

  console.log("[PARAMETER][COMMAND_CREATED]", { deviceId: input.deviceId, commandType: input.commandType, status: command.status });
  return command;
}

export async function completeParameterCommand(commandId: string, deviceId: string, status: ParameterCommandStatus, responsePayload?: Record<string, unknown>, errorMessage?: string) {
  const commands = commandsByDevice.get(deviceId) ?? [];
  const completedAt = new Date().toISOString();
  const command = commands.find((item) => item.id === commandId);
  if (command) {
    command.status = status;
    command.responsePayload = responsePayload;
    command.errorMessage = errorMessage;
    command.completedAt = completedAt;
  }

  const delegate = prismaDelegate("deviceParameterCommand");
  if (delegate?.update) {
    try {
      await delegate.update({ where: { id: commandId }, data: { status, responsePayload, errorMessage, completedAt: new Date(completedAt) } });
    } catch {
      // Ignore database mismatch in mock mode.
    }
  }
  console.log("[PARAMETER][COMMAND_COMPLETED]", { deviceId, commandId, status });
  return command;
}

export async function listParameterHistory(deviceId: string) {
  let snapshots = snapshotsByDevice.get(deviceId) ?? [];
  let commands = commandsByDevice.get(deviceId) ?? [];
  const snapshotDelegate = prismaDelegate("deviceParameterSnapshot");
  const commandDelegate = prismaDelegate("deviceParameterCommand");
  try {
    if (snapshotDelegate?.findMany) {
      const rows = await snapshotDelegate.findMany({ where: { deviceId }, orderBy: { readAt: "desc" }, take: 50 });
      snapshots = rows.map((row: any) => ({
        id: row.id,
        deviceId: row.deviceId,
        source: row.source ?? "READ",
        parameters: row.parameters,
        readAt: row.readAt.toISOString(),
        createdById: row.createdById ?? undefined,
        createdAt: (row.createdAt ?? row.readAt).toISOString(),
      }));
    }
    if (commandDelegate?.findMany) {
      const rows = await commandDelegate.findMany({ where: { deviceId }, orderBy: { requestedAt: "desc" }, take: 100 });
      commands = rows.map((row: any) => ({
        id: row.id,
        deviceId: row.deviceId,
        commandType: row.commandType,
        status: row.status,
        requestedPayload: row.requestedPayload ?? undefined,
        responsePayload: row.responsePayload ?? undefined,
        errorMessage: row.errorMessage ?? undefined,
        requestedById: row.requestedById ?? undefined,
        requestedAt: row.requestedAt.toISOString(),
        completedAt: row.completedAt?.toISOString(),
        reservedFor: row.reservedFor?.toISOString(),
      }));
    }
  } catch {
    // Memory state is enough when the local database has not been migrated.
  }
  return {
    snapshots,
    commands,
  };
}

export async function listParameterReservations(deviceId: string) {
  const history = await listParameterHistory(deviceId);
  return history.commands.filter((command) => command.commandType === "RESERVED_UPDATE_PARAMETERS" || command.status === "RESERVED");
}

export async function saveParameterAuditLog(input: {
  deviceId: string;
  commandId?: string;
  action: "READ" | "UPDATE" | "RESERVE" | "VALIDATION_ERROR";
  details?: Record<string, unknown>;
  userId?: string;
}) {
  const delegate = prismaDelegate("deviceParameterAuditLog");
  if (delegate?.create) {
    try {
      await delegate.create({ data: input });
    } catch {
      // Command and control audit logs still provide traceability in mock/local mode.
    }
  }
}
