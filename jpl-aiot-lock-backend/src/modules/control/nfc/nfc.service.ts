import { randomUUID } from "crypto";
import { DeviceCommandRecord } from "../control.types";
import { auditControlAction } from "../shared/control-audit.service";
import { findControlDevice } from "../shared/control-device-selector.service";
import type { NfcCardItem } from "./nfc.types";

const cardsByDevice = new Map<string, NfcCardItem[]>();
const commands: DeviceCommandRecord[] = [];

function assertDevice(deviceId: string) {
  const device = findControlDevice(deviceId);
  if (!device) {
    const error = new Error("Device not found");
    Object.assign(error, { statusCode: 404, code: "CONTROL_DEVICE_NOT_FOUND" });
    throw error;
  }
}

export function getNfcCards(deviceId: string) {
  assertDevice(deviceId);
  return { blockNumber: "Block 1", cards: cardsByDevice.get(deviceId) ?? [] };
}

export function readNfcCards(deviceId: string, userId?: string) {
  assertDevice(deviceId);
  auditControlAction({ action: "NFC_READ", deviceId, userId });
  return getNfcCards(deviceId);
}

export function addNfcCard(deviceId: string, cardNumber: string, blockNumber = "Block 1", userId?: string) {
  assertDevice(deviceId);
  const item: NfcCardItem = {
    id: randomUUID(),
    deviceId,
    cardNumber,
    blockNumber,
    status: "PENDING_SYNC",
  };
  cardsByDevice.set(deviceId, [...(cardsByDevice.get(deviceId) ?? []), item]);
  auditControlAction({ action: "NFC_ADD", deviceId, userId, metadata: { blockNumber } });
  return item;
}

export function syncNfcCards(deviceId: string, userId?: string) {
  assertDevice(deviceId);
  const syncedAt = new Date().toISOString();
  const cards = (cardsByDevice.get(deviceId) ?? []).map((card) => ({ ...card, status: "ACTIVE" as const, syncedAt }));
  cardsByDevice.set(deviceId, cards);
  auditControlAction({ action: "NFC_SYNC", deviceId, userId });
  return { syncedAt, cards };
}

export function clearNfcCards(deviceId: string, userId?: string) {
  assertDevice(deviceId);
  cardsByDevice.set(deviceId, []);
  auditControlAction({ action: "NFC_CLEAR", deviceId, userId });
  return { cleared: true };
}

export function reserveNfcCommand(deviceId: string, userId?: string) {
  assertDevice(deviceId);
  const command: DeviceCommandRecord = {
    id: randomUUID(),
    sortNo: commands.length + 1,
    deviceId,
    commandType: "NFC_SYNC",
    commandContent: "Batch Reserve Command",
    status: "RESERVED",
    submittedReservedCommand: true,
    operator: "Mock operator",
    createdAt: new Date().toISOString(),
  };
  commands.unshift(command);
  auditControlAction({ action: "NFC_RESERVE_COMMAND", deviceId, commandId: command.id, userId });
  return command;
}
