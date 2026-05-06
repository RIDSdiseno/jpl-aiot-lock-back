import { randomUUID } from "crypto";
import { createCommandRecord } from "../commands/command-record.service";
import { auditControlAction } from "../shared/control-audit.service";
import { findControlDevice } from "../shared/control-device-selector.service";
import type { NfcCardItem } from "./nfc.types";

const cardsByDevice = new Map<string, NfcCardItem[]>();
const readStateByDevice = new Set<string>();

function assertDevice(deviceId: string) {
  const device = findControlDevice(deviceId);
  if (!device) {
    const error = new Error("Device not found");
    Object.assign(error, { statusCode: 404, code: "CONTROL_DEVICE_NOT_FOUND" });
    throw error;
  }
}

export function getNfcCards(deviceId: string, blockNumber = "Block 1") {
  assertDevice(deviceId);
  return { blockNumber, cards: (cardsByDevice.get(deviceId) ?? []).filter((card) => (card.blockNumber ?? "Block 1") === blockNumber) };
}

export function readNfcCards(deviceId: string, blockNumber = "Block 1", userId?: string) {
  assertDevice(deviceId);
  readStateByDevice.add(`${deviceId}:${blockNumber}`);
  createCommandRecord({
    deviceId,
    commandType: "NFC_READ",
    commandContent: `Read NFC cards ${blockNumber}`,
    status: "SUCCESS",
    progress: 100,
    payload: { blockNumber },
    operatorId: userId,
    response: { cards: getNfcCards(deviceId, blockNumber).cards.length },
  });
  auditControlAction({ action: "NFC_READ", deviceId, userId });
  return getNfcCards(deviceId, blockNumber);
}

export function addNfcCard(deviceId: string, cardNumber: string, blockNumber = "Block 1", userId?: string) {
  assertDevice(deviceId);
  const trimmed = cardNumber.trim();
  if (!/^\d{8}$/.test(trimmed)) {
    const error = new Error("Card number must contain 8 numeric digits");
    Object.assign(error, { statusCode: 400, code: "CONTROL_NFC_INVALID_CARD" });
    throw error;
  }
  if ((cardsByDevice.get(deviceId) ?? []).some((card) => card.cardNumber === trimmed && (card.blockNumber ?? "Block 1") === blockNumber)) {
    const error = new Error("Duplicated NFC card number");
    Object.assign(error, { statusCode: 409, code: "CONTROL_NFC_DUPLICATED_CARD" });
    throw error;
  }
  const item: NfcCardItem = {
    id: randomUUID(),
    deviceId,
    cardNumber: trimmed,
    blockNumber,
    status: "PENDING_SYNC",
  };
  cardsByDevice.set(deviceId, [...(cardsByDevice.get(deviceId) ?? []), item]);
  auditControlAction({ action: "NFC_ADD", deviceId, userId, metadata: { blockNumber } });
  return item;
}

export function syncNfcCards(deviceId: string, userId?: string, incomingCards?: Array<{ cardNumber: string; blockNumber?: string }>) {
  assertDevice(deviceId);
  if (![...readStateByDevice].some((key) => key.startsWith(`${deviceId}:`))) {
    const error = new Error("Read NFC cards before synchronizing");
    Object.assign(error, { statusCode: 409, code: "CONTROL_NFC_READ_REQUIRED" });
    throw error;
  }
  const syncedAt = new Date().toISOString();
  const sourceCards = incomingCards
    ? incomingCards.map((card) => ({
        id: randomUUID(),
        deviceId,
        cardNumber: card.cardNumber,
        blockNumber: card.blockNumber ?? "Block 1",
        status: "PENDING_SYNC" as const,
      }))
    : cardsByDevice.get(deviceId) ?? [];
  const cards = sourceCards.map((card) => ({ ...card, status: "ACTIVE" as const, syncedAt }));
  cardsByDevice.set(deviceId, cards);
  createCommandRecord({
    deviceId,
    commandType: "NFC_SYNC",
    commandContent: "Sync NFC cards",
    status: "SUCCESS",
    progress: 100,
    payload: { cards: cards.map((card) => card.cardNumber) },
    operatorId: userId,
    response: { syncedAt },
  });
  auditControlAction({ action: "NFC_SYNC", deviceId, userId });
  return { syncedAt, cards };
}

export function clearNfcCards(deviceId: string, userId?: string) {
  assertDevice(deviceId);
  cardsByDevice.set(deviceId, []);
  createCommandRecord({
    deviceId,
    commandType: "NFC_CLEAR",
    commandContent: "Clear NFC card binding data",
    status: "SUCCESS",
    progress: 100,
    operatorId: userId,
  });
  auditControlAction({ action: "NFC_CLEAR", deviceId, userId });
  return { cleared: true };
}

export function reserveNfcCommand(deviceId: string, userId?: string) {
  assertDevice(deviceId);
  const command = createCommandRecord({
    deviceId,
    commandType: "NFC_SYNC",
    commandContent: "Batch Reserve Command",
    status: "RESERVED",
    progress: 0,
    payload: { executeWhenOnline: true },
    submittedReservedCommand: true,
    operatorId: userId,
  });
  auditControlAction({ action: "NFC_RESERVE_COMMAND", deviceId, commandId: command.id, userId });
  return command;
}
