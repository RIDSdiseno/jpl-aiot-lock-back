import { createCommandRecord } from "../commands/command-record.service";
import { auditControlAction } from "../shared/control-audit.service";
import { categories, getDefaultParameters, parameterSchema, sanitizeUpdatesForLog, validateParameterUpdates } from "./parameter.schema";
import {
  completeParameterCommand,
  createParameterCommand,
  findParameterDevice,
  getLatestSnapshot,
  listParameterReservations,
  listParameterDevices,
  listParameterHistory,
  saveSnapshot,
  saveParameterAuditLog,
} from "./parameter.repository";
import * as gateway from "./parameterGateway.service";
import { ParameterError, type ParameterDeviceFilters, type ParameterField, type ParameterUpdateInput } from "./parameter.types";

function assertDevice(deviceId: string) {
  const device = findParameterDevice(deviceId);
  if (!device) throw new ParameterError("DEVICE_NOT_FOUND", "Device not found", 404);
  return device;
}

function normalizeLegacyFields(fields: ParameterField[]): ParameterUpdateInput[] {
  return fields.map((field) => ({ key: field.key, value: field.value ?? null }));
}

export function getSchema() {
  console.log("[PARAMETER][SCHEMA_LOAD]");
  return { categories, parameters: parameterSchema };
}

export function getDevices(filters: ParameterDeviceFilters = {}) {
  console.log("[PARAMETER][DEVICES_LIST]", filters);
  return listParameterDevices(filters);
}

export async function getLatest(deviceId: string) {
  const device = assertDevice(deviceId);
  console.log("[PARAMETER][LATEST_REQUEST]", { deviceId });
  const latest = await getLatestSnapshot(deviceId);
  return {
    deviceId,
    readAt: latest?.readAt ?? null,
    parameters: latest?.parameters ?? getDefaultParameters(device.imei),
    lastSnapshot: latest,
  };
}

export async function getParameters(deviceId: string) {
  const latest = await getLatest(deviceId);
  return {
    deviceId,
    readTime: latest.readAt,
    fields: Object.values(latest.parameters).flat(),
  };
}

export async function readParameters(deviceId: string, userId?: string) {
  const device = assertDevice(deviceId);
  console.log("[PARAMETER][READ_REQUEST]", { deviceId, requestedBy: userId });
  const command = await createParameterCommand({ deviceId, commandType: "READ_PARAMETERS", requestedById: userId });

  if (device.status === "OFFLINE") {
    await completeParameterCommand(command.id, deviceId, "OFFLINE", undefined, "Device is offline");
    await saveParameterAuditLog({ deviceId, commandId: command.id, action: "READ", details: { status: "OFFLINE" }, userId });
    createCommandRecord({
      deviceId,
      commandType: "READ_PARAMETERS",
      commandContent: "Read device parameters",
      status: "FAILED",
      progress: 100,
      payload: { commandId: command.id },
      response: { status: "OFFLINE" },
      operatorId: userId,
    });
    console.log("[PARAMETER][READ_OFFLINE]", { deviceId });
    return {
      ok: false,
      status: "OFFLINE",
      message: "Device is offline. Showing last saved parameters.",
      lastSnapshot: await getLatestSnapshot(deviceId),
    };
  }

  try {
    const result = await gateway.readDeviceParameters(deviceId);
    if (result.status === "PENDING") {
      await completeParameterCommand(command.id, deviceId, "PENDING", { reason: "DEVICE_SLEEP" });
      createCommandRecord({
        deviceId,
        commandType: "READ_PARAMETERS",
        commandContent: "Read device parameters",
        status: "PENDING",
        progress: 10,
        payload: { commandId: command.id },
        response: { status: "PENDING", reason: "DEVICE_SLEEP" },
        operatorId: userId,
      });
      console.log("[PARAMETER][READ_REQUEST]", { deviceId, commandId: command.id, status: "PENDING" });
      return {
        ok: true,
        status: "PENDING",
        message: "Command sent and waiting for device response.",
        data: { commandId: command.id },
        commandId: command.id,
        deviceId,
        fields: Object.values((await getLatest(deviceId)).parameters).flat(),
      };
    }
    const snapshot = await saveSnapshot({ deviceId, source: "READ", parameters: result.parameters, createdById: userId, readAt: result.readAt });
    await completeParameterCommand(command.id, deviceId, "SUCCESS", { readAt: result.readAt });
    await saveParameterAuditLog({ deviceId, commandId: command.id, action: "READ", details: { status: "SUCCESS", readAt: result.readAt }, userId });
    createCommandRecord({
      deviceId,
      commandType: "READ_PARAMETERS",
      commandContent: "Read device parameters",
      status: "SUCCESS",
      progress: 100,
      payload: { categories: Object.keys(result.parameters) },
      response: { readAt: result.readAt },
      operatorId: userId,
    });
    auditControlAction({ action: "PARAMETER_READ", deviceId, commandId: command.id, userId });
    console.log("[PARAMETER][READ_SUCCESS]", { deviceId, readAt: result.readAt });
    return {
      ok: true,
      status: "SUCCESS",
      message: "Device parameters read successfully",
      data: {
        deviceId,
        readAt: snapshot.readAt,
        parameters: snapshot.parameters,
      },
      deviceId,
      readTime: snapshot.readAt,
      fields: Object.values(snapshot.parameters).flat(),
    };
  } catch (error) {
    const parameterError = error as ParameterError;
    await completeParameterCommand(command.id, deviceId, "FAILED", undefined, parameterError.message);
    createCommandRecord({
      deviceId,
      commandType: "READ_PARAMETERS",
      commandContent: "Read device parameters",
      status: "FAILED",
      progress: 100,
      payload: { commandId: command.id },
      response: { errorCode: parameterError.code ?? "IOT_GATEWAY_ERROR" },
      operatorId: userId,
    });
    console.log("[PARAMETER][READ_FAILED]", { deviceId, code: parameterError.code ?? "IOT_GATEWAY_ERROR" });
    throw error;
  }
}

export async function updateParameters(deviceId: string, updatesOrFields: ParameterUpdateInput[] | ParameterField[], userId?: string) {
  const device = assertDevice(deviceId);
  const updates = normalizeLegacyFields(updatesOrFields as ParameterField[]);
  console.log("[PARAMETER][UPDATE_REQUEST]", { deviceId, parameters: sanitizeUpdatesForLog(updates) });

  if (!updates.length) {
    console.log("[PARAMETER][VALIDATION_ERROR]", { deviceId, code: "INVALID_PARAMETER_VALUE", message: "No modified parameters provided." });
    await saveParameterAuditLog({ deviceId, action: "VALIDATION_ERROR", details: { code: "INVALID_PARAMETER_VALUE", message: "No modified parameters provided." }, userId });
    throw new ParameterError("INVALID_PARAMETER_VALUE", "No modified parameters provided.", 400);
  }

  const validations = validateParameterUpdates(updates);
  const invalid = validations.find((item) => !item.ok);
  if (invalid && !invalid.ok) {
    console.log("[PARAMETER][VALIDATION_ERROR]", { deviceId, code: invalid.code, message: invalid.message, parameters: sanitizeUpdatesForLog(updates) });
    await saveParameterAuditLog({ deviceId, action: "VALIDATION_ERROR", details: { code: invalid.code, message: invalid.message, parameters: sanitizeUpdatesForLog(updates) }, userId });
    throw new ParameterError(invalid.code as any, invalid.message, 400);
  }

  if (device.status === "OFFLINE") {
    const command = await createParameterCommand({
      deviceId,
      commandType: "UPDATE_PARAMETERS",
      status: "OFFLINE",
      requestedPayload: { parameters: sanitizeUpdatesForLog(updates) },
      requestedById: userId,
    });
    await saveParameterAuditLog({ deviceId, commandId: command.id, action: "UPDATE", details: { status: "OFFLINE", parameters: sanitizeUpdatesForLog(updates) }, userId });
    console.log("[PARAMETER][UPDATE_FAILED]", { deviceId, commandId: command.id, code: "DEVICE_OFFLINE" });
    return {
      ok: false,
      status: "OFFLINE",
      message: "Device is offline. Showing last saved parameters.",
      commandId: command.id,
      lastSnapshot: await getLatestSnapshot(deviceId),
    };
  }

  const command = await createParameterCommand({
    deviceId,
    commandType: "UPDATE_PARAMETERS",
    requestedPayload: { parameters: sanitizeUpdatesForLog(updates) },
    requestedById: userId,
  });

  try {
    const latest = await getLatest(deviceId);
    const result = await gateway.updateDeviceParameters(deviceId, latest.parameters, updates);
    if (result.status === "PENDING" || !result.parameters) {
      await completeParameterCommand(command.id, deviceId, "PENDING", { queued: true });
      createCommandRecord({
        deviceId,
        commandType: "UPDATE_PARAMETERS",
        commandContent: "Parameter update",
        status: "PENDING",
        progress: 10,
        payload: { parameters: sanitizeUpdatesForLog(updates) },
        response: { status: "PENDING" },
        operatorId: userId,
      });
      console.log("[PARAMETER][UPDATE_PENDING]", { deviceId, commandId: command.id });
      return {
        ok: true,
        status: "PENDING",
        message: "Command sent and waiting for device response.",
        data: { commandId: command.id },
        commandId: command.id,
      };
    }
    await saveSnapshot({ deviceId, source: "UPDATE_RESULT", parameters: result.parameters, createdById: userId, readAt: result.readAt });
    await completeParameterCommand(command.id, deviceId, "SUCCESS", { updatedKeys: updates.map((item) => item.key) });
    await saveParameterAuditLog({ deviceId, commandId: command.id, action: "UPDATE", details: { status: "SUCCESS", parameters: sanitizeUpdatesForLog(updates) }, userId });
    createCommandRecord({
      deviceId,
      commandType: "UPDATE_PARAMETERS",
      commandContent: "Parameter update",
      status: "SUCCESS",
      progress: 100,
      payload: { parameters: sanitizeUpdatesForLog(updates) },
      response: { updated: true },
      operatorId: userId,
    });
    auditControlAction({ action: "PARAMETER_UPDATE", deviceId, commandId: command.id, userId, metadata: { changedKeys: updates.map((field) => field.key) } });
    console.log("[PARAMETER][UPDATE_SUCCESS]", { deviceId, commandId: command.id });
    return {
      ok: true,
      status: "SUCCESS",
      message: "Device parameters updated successfully",
      commandId: command.id,
      deviceId,
      updated: true,
      fields: Object.values(result.parameters).flat(),
    };
  } catch (error) {
    const parameterError = error as ParameterError;
    const status = parameterError.code === "DEVICE_OFFLINE" ? "OFFLINE" : "FAILED";
    await completeParameterCommand(command.id, deviceId, status, undefined, parameterError.message);
    console.log("[PARAMETER][UPDATE_FAILED]", { deviceId, commandId: command.id, code: parameterError.code ?? "IOT_GATEWAY_ERROR" });
    if (status === "OFFLINE") {
      createCommandRecord({
        deviceId,
        commandType: "UPDATE_PARAMETERS",
        commandContent: "Parameter update",
        status: "FAILED",
        progress: 100,
        payload: { commandId: command.id, parameters: sanitizeUpdatesForLog(updates) },
        response: { status: "OFFLINE" },
        operatorId: userId,
      });
      return {
        ok: false,
        status: "OFFLINE",
        message: "Device is offline. Showing last saved parameters.",
        commandId: command.id,
        lastSnapshot: await getLatestSnapshot(deviceId),
      };
    }
    createCommandRecord({
      deviceId,
      commandType: "UPDATE_PARAMETERS",
      commandContent: "Parameter update",
      status: "FAILED",
      progress: 100,
      payload: { commandId: command.id, parameters: sanitizeUpdatesForLog(updates) },
      response: { errorCode: parameterError.code ?? "IOT_GATEWAY_ERROR" },
      operatorId: userId,
    });
    throw error;
  }
}

export async function reserveParameterCommand(deviceId: string, userId?: string) {
  assertDevice(deviceId);
  const parameterCommand = await createParameterCommand({
    deviceId,
    commandType: "RESERVED_UPDATE_PARAMETERS",
    status: "RESERVED",
    requestedPayload: { parameters: [] },
    requestedById: userId,
    reservedFor: new Date(Date.now() + 3600_000).toISOString(),
  });
  const commandRecord = createCommandRecord({
    deviceId,
    commandType: "RESERVED_UPDATE_PARAMETERS",
    commandContent: "Reservation CMD",
    status: "RESERVED",
    progress: 0,
    payload: { parameterCommandId: parameterCommand.id, executeWhenOnline: true },
    submittedReservedCommand: true,
    operatorId: userId,
  });
  auditControlAction({ action: "PARAMETER_RESERVE_COMMAND", deviceId, commandId: parameterCommand.id, userId });
  await saveParameterAuditLog({ deviceId, commandId: parameterCommand.id, action: "RESERVE", details: { status: "RESERVED" }, userId });
  console.log("[PARAMETER][RESERVATION_CREATED]", { deviceId, commandId: parameterCommand.id });
  return commandRecord;
}

export async function getHistory(deviceId: string) {
  assertDevice(deviceId);
  return listParameterHistory(deviceId);
}

export async function getSnapshots(deviceId: string) {
  return (await getHistory(deviceId)).snapshots;
}

export async function getReservations(deviceId: string) {
  assertDevice(deviceId);
  return listParameterReservations(deviceId);
}
