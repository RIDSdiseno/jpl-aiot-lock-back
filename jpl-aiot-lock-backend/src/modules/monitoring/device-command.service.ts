import { CommandStatus } from "@prisma/client";
import { auditMonitoringAction } from "./monitoring-audit.service";
import { getDeviceById } from "./monitoring.service";
import type {
  MonitoringCommandResult,
  MonitoringCurrentUser,
  MonitoringDeviceParameters,
  NfcCard,
} from "./monitoring.types";

const parametersByDevice = new Map<string, MonitoringDeviceParameters>();
const nfcCardsByDevice = new Map<string, NfcCard[]>();

function commandId(deviceId: string, command: string) {
  return `${deviceId}-${command}-${Date.now()}`;
}

async function canUnseal(currentUser: MonitoringCurrentUser) {
  if (["SUPER_ADMIN", "ADMIN_EMPRESA"].includes(currentUser.role ?? "")) return true;
  return false;
}

export async function sendDeviceCommand(
  currentUser: MonitoringCurrentUser,
  deviceId: string,
  command: "seal" | "unseal" | "advance",
  payload?: Record<string, unknown>,
): Promise<MonitoringCommandResult> {
  const device = await getDeviceById(deviceId);

  if (command === "unseal" && !(await canUnseal(currentUser))) {
    await auditMonitoringAction(currentUser, "UNSEAL_DENIED", device.id, { reason: "missing_special_permission" });
    throw new Error("Unseal requires special permission");
  }

  const queued = device.status === "offline";
  const status = queued ? CommandStatus.PENDING : CommandStatus.SENT;
  await auditMonitoringAction(currentUser, command.toUpperCase(), device.id, { queued, payload });

  return {
    commandId: commandId(device.id, command),
    deviceId: device.id,
    command,
    status,
    queued,
    message: queued ? "Device offline. Command queued for next connection." : "Command sent to provider adapter.",
    createdAt: new Date().toISOString(),
  };
}

export async function getParameters(currentUser: MonitoringCurrentUser, deviceId: string) {
  await getDeviceById(deviceId);
  await auditMonitoringAction(currentUser, "PARAMETER_VIEW", deviceId);
  return parametersByDevice.get(deviceId) ?? {
    heartbeatSeconds: 60,
    gpsIntervalSeconds: 120,
    overspeedLimitKmh: 80,
    alarmEnabled: true,
  };
}

export async function readParameters(currentUser: MonitoringCurrentUser, deviceId: string) {
  await auditMonitoringAction(currentUser, "PARAMETER_READ", deviceId);
  return getParameters(currentUser, deviceId);
}

export async function updateParameters(
  currentUser: MonitoringCurrentUser,
  deviceId: string,
  parameters: Partial<MonitoringDeviceParameters>,
) {
  const current = await getParameters(currentUser, deviceId);
  const next = { ...current, ...parameters };
  parametersByDevice.set(deviceId, next);
  await auditMonitoringAction(currentUser, "PARAMETER_UPDATE", deviceId, next);
  return next;
}

export async function getDynamicPassword(currentUser: MonitoringCurrentUser, deviceId: string) {
  await getDeviceById(deviceId);
  await auditMonitoringAction(currentUser, "DYNAMIC_PASSWORD_VIEW", deviceId);
  return {
    deviceId,
    password: String(Math.floor(100000 + Math.random() * 900000)),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
}

export async function getNfcCards(currentUser: MonitoringCurrentUser, deviceId: string) {
  await getDeviceById(deviceId);
  await auditMonitoringAction(currentUser, "NFC_VIEW", deviceId);
  return nfcCardsByDevice.get(deviceId) ?? [
    { id: "nfc-demo-1", cardNo: "A0-11-92-7F", holder: "Operador DEMO", status: "active", syncedAt: null },
  ];
}

export async function readNfcCards(currentUser: MonitoringCurrentUser, deviceId: string) {
  await auditMonitoringAction(currentUser, "NFC_READ", deviceId);
  return getNfcCards(currentUser, deviceId);
}

export async function addNfcCard(currentUser: MonitoringCurrentUser, deviceId: string, card: Partial<NfcCard>) {
  const cards = await getNfcCards(currentUser, deviceId);
  const nextCard: NfcCard = {
    id: `nfc-${Date.now()}`,
    cardNo: card.cardNo ?? "NEW-CARD",
    holder: card.holder ?? "Sin asignar",
    status: card.status ?? "active",
    syncedAt: null,
  };
  const next = [...cards, nextCard];
  nfcCardsByDevice.set(deviceId, next);
  await auditMonitoringAction(currentUser, "NFC_ADD", deviceId, nextCard);
  return nextCard;
}

export async function syncNfcCards(currentUser: MonitoringCurrentUser, deviceId: string) {
  const now = new Date().toISOString();
  const cards = (await getNfcCards(currentUser, deviceId)).map((card) => ({ ...card, syncedAt: now }));
  nfcCardsByDevice.set(deviceId, cards);
  await auditMonitoringAction(currentUser, "NFC_SYNC", deviceId);
  return cards;
}

export async function deleteNfcCards(currentUser: MonitoringCurrentUser, deviceId: string, cardIds: string[]) {
  const cards = await getNfcCards(currentUser, deviceId);
  const next = cards.filter((card) => !cardIds.includes(card.id));
  nfcCardsByDevice.set(deviceId, next);
  await auditMonitoringAction(currentUser, "NFC_DELETE", deviceId, { cardIds });
  return next;
}
