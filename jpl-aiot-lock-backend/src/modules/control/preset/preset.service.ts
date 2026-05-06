import { createCommandRecord } from "../commands/command-record.service";
import { auditControlAction } from "../shared/control-audit.service";
import { findControlDevice } from "../shared/control-device-selector.service";

function validateDeviceIds(deviceIds: string[]) {
  if (!deviceIds.length) {
    const error = new Error("At least one device is required");
    Object.assign(error, { statusCode: 400, code: "CONTROL_PRESET_DEVICE_REQUIRED" });
    throw error;
  }
  for (const deviceId of deviceIds) {
    if (!findControlDevice(deviceId)) {
      const error = new Error(`Device ${deviceId} not found`);
      Object.assign(error, { statusCode: 404, code: "CONTROL_DEVICE_NOT_FOUND" });
      throw error;
    }
  }
}

function validatePresetPayload(payload: Record<string, unknown>) {
  if (!payload.expirationTime) {
    const error = new Error("CMD expiration time is required");
    Object.assign(error, { statusCode: 400, code: "CONTROL_PRESET_EXPIRATION_REQUIRED" });
    throw error;
  }
  const tcpPort = payload.tcpPort ? Number(payload.tcpPort) : undefined;
  if (tcpPort !== undefined && (!Number.isInteger(tcpPort) || tcpPort < 1 || tcpPort > 65535)) {
    const error = new Error("TCP Port must be between 1 and 65535");
    Object.assign(error, { statusCode: 400, code: "CONTROL_PRESET_INVALID_PORT" });
    throw error;
  }
}

export function createPresetCommand(input: { deviceIds: string[]; payload: Record<string, unknown>; userId?: string }) {
  validateDeviceIds(input.deviceIds);
  validatePresetPayload(input.payload);
  const commands = input.deviceIds.map((deviceId) => {
    const device = findControlDevice(deviceId);
    const command = createCommandRecord({
      deviceId,
      commandType: "PRESET_UPDATE",
      commandContent: "Preset reservation setting",
      status: device?.isOnline ? "PENDING" : "RESERVED",
      progress: 0,
      payload: input.payload,
      operatorId: input.userId,
      submittedReservedCommand: !device?.isOnline,
    });
    auditControlAction({ action: "PRESET_UPDATE", deviceId, commandId: command.id, userId: input.userId, metadata: input.payload });
    return command;
  });
  return { commands };
}

export function createBatchCardBinding(input: { deviceIds: string[]; cards: string[]; expirationTime: string; userId?: string }) {
  validateDeviceIds(input.deviceIds);
  const cards = input.cards.map((card) => card.trim()).filter(Boolean);
  if (!cards.length || cards.some((card) => !/^\d{8}$/.test(card))) {
    const error = new Error("Batch card binding requires 8 digit card numbers");
    Object.assign(error, { statusCode: 400, code: "CONTROL_PRESET_INVALID_CARDS" });
    throw error;
  }
  if (new Set(cards).size !== cards.length) {
    const error = new Error("Duplicated card numbers are not allowed");
    Object.assign(error, { statusCode: 409, code: "CONTROL_PRESET_DUPLICATED_CARDS" });
    throw error;
  }
  const payload = { expirationTime: input.expirationTime, cards };
  const commands = input.deviceIds.map((deviceId) => {
    const device = findControlDevice(deviceId);
    const command = createCommandRecord({
      deviceId,
      commandType: "BATCH_CARD_BINDING",
      commandContent: "Batch card binding",
      status: device?.isOnline ? "PENDING" : "RESERVED",
      progress: 0,
      payload,
      operatorId: input.userId,
      submittedReservedCommand: !device?.isOnline,
    });
    auditControlAction({ action: "BATCH_CARD_BINDING", deviceId, commandId: command.id, userId: input.userId, metadata: payload });
    return command;
  });
  return { commands };
}
