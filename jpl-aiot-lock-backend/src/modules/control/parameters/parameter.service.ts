import { randomUUID } from "crypto";
import type { DeviceCommandRecord, DeviceParameterField } from "../control.types";
import { createCommandRecord } from "../commands/command-record.service";
import { auditControlAction } from "../shared/control-audit.service";
import { findControlDevice } from "../shared/control-device-selector.service";
import type { DeviceParameterSnapshot } from "./parameter.types";

const communicationFields: DeviceParameterField[] = [
  { key: "bluetoothAppFixedOperationPassword", label: "Bluetooth APP fixed operation password", value: "123456", category: "ble", sensitive: true },
  { key: "bluetoothDeviceName", label: "Bluetooth device name", value: "JPL-G300N", category: "ble" },
  { key: "primaryServerAddress", label: "Primary server address", value: "iot.jpl.cl", category: "communication" },
  { key: "primaryServerTcpPort", label: "Primary server TCP port", value: "1883", category: "communication" },
  { key: "backupServerAddress", label: "Backup server address", value: "", category: "communication" },
  { key: "backupServerTcpPort", label: "Backup server TCP port", value: "", category: "communication" },
  { key: "apnNameSim1", label: "APN Name (sim1)", value: "m2m.claro.cl", category: "communication" },
  { key: "apnUsernameSim1", label: "APN Username (sim1)", value: "", category: "communication" },
  { key: "apnPasswordSim1", label: "APN Password (sim1)", value: "", category: "communication", sensitive: true },
];

const parametersByDevice = new Map<string, DeviceParameterField[]>([["708049716934", communicationFields]]);
const snapshotsByDevice = new Map<string, DeviceParameterSnapshot[]>();

function assertDevice(deviceId: string) {
  if (!findControlDevice(deviceId)) {
    const error = new Error("Device not found");
    Object.assign(error, { statusCode: 404, code: "CONTROL_DEVICE_NOT_FOUND" });
    throw error;
  }
}

export function getParameters(deviceId: string) {
  assertDevice(deviceId);
  return {
    deviceId,
    readTime: snapshotsByDevice.get(deviceId)?.[0]?.readAt ?? null,
    fields: parametersByDevice.get(deviceId) ?? communicationFields.map((field) => ({ ...field, value: "" })),
  };
}

export function readParameters(deviceId: string, userId?: string) {
  assertDevice(deviceId);
  const readAt = new Date().toISOString();
  const fields = getParameters(deviceId).fields;
  const snapshot: DeviceParameterSnapshot = {
    id: randomUUID(),
    deviceId,
    category: "communication",
    parameters: fields,
    readAt,
    rawPayload: { provider: "mock" },
  };
  snapshotsByDevice.set(deviceId, [snapshot, ...(snapshotsByDevice.get(deviceId) ?? [])]);
  createCommandRecord({
    deviceId,
    commandType: "PARAMETER_READ",
    commandContent: "Read device parameters",
    status: "SUCCESS",
    progress: 100,
    payload: { categories: [...new Set(fields.map((field) => field.category))] },
    response: { readAt },
    operatorId: userId,
  });
  auditControlAction({ action: "PARAMETER_READ", deviceId, userId });
  return { deviceId, readTime: readAt, fields };
}

export function updateParameters(deviceId: string, fields: DeviceParameterField[], userId?: string) {
  assertDevice(deviceId);
  for (const field of fields) {
    if (field.value && field.value.length > 120) {
      const error = new Error(`Parameter ${field.key} is too long`);
      Object.assign(error, { statusCode: 400, code: "CONTROL_PARAMETER_TOO_LONG" });
      throw error;
    }
  }
  parametersByDevice.set(deviceId, fields);
  createCommandRecord({
    deviceId,
    commandType: "PARAMETER_UPDATE",
    commandContent: "Parameter update",
    status: "SUCCESS",
    progress: 100,
    payload: { fields },
    response: { updated: true },
    operatorId: userId,
  });
  auditControlAction({ action: "PARAMETER_UPDATE", deviceId, userId, metadata: { changedKeys: fields.map((field) => field.key) } });
  return { deviceId, updated: true, fields };
}

export function reserveParameterCommand(deviceId: string, userId?: string): DeviceCommandRecord {
  assertDevice(deviceId);
  const command: DeviceCommandRecord = createCommandRecord({
    deviceId,
    commandType: "PARAMETER_UPDATE",
    commandContent: "Reservation CMD",
    status: "RESERVED",
    progress: 0,
    payload: { executeWhenOnline: true },
    submittedReservedCommand: true,
    operatorId: userId,
  });
  auditControlAction({ action: "PARAMETER_RESERVE_COMMAND", deviceId, commandId: command.id, userId });
  return command;
}

export function getSnapshots(deviceId: string) {
  assertDevice(deviceId);
  return snapshotsByDevice.get(deviceId) ?? [];
}
