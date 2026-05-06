import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { DeviceCommandRecord } from "../control.types";
import { auditControlAction } from "../shared/control-audit.service";
import { findControlDevice } from "../shared/control-device-selector.service";

const storePath = path.resolve(process.cwd(), "data", "control-command-records.json");

const seedRecords: DeviceCommandRecord[] = [
  {
    id: randomUUID(),
    sortNo: 1,
    deviceId: "708049716934",
    commandContent: "Read communication parameters",
    commandType: "PARAMETER_READ",
    status: "EXECUTED",
    executionTime: new Date().toISOString(),
    responseContent: "OK",
    submittedReservedCommand: false,
    operator: "Mock operator",
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: randomUUID(),
    sortNo: 2,
    deviceId: "553071206110",
    commandContent: "Sync NFC cards",
    commandType: "NFC_SYNC",
    status: "RESERVED",
    submittedReservedCommand: true,
    operator: "Mock operator",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function ensureStore() {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, JSON.stringify(seedRecords, null, 2), "utf8");
  }
}

function readRecords(): DeviceCommandRecord[] {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(storePath, "utf8")) as DeviceCommandRecord[];
  } catch {
    return [...seedRecords];
  }
}

function writeRecords(records: DeviceCommandRecord[]) {
  ensureStore();
  fs.writeFileSync(storePath, JSON.stringify(records, null, 2), "utf8");
}

export function createCommandRecord(input: {
  deviceId: string;
  commandType: string;
  commandContent?: string;
  status?: DeviceCommandRecord["status"];
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
  operatorId?: string;
  operator?: string;
  submittedReservedCommand?: boolean;
  progress?: number;
}) {
  const records = readRecords();
  const device = findControlDevice(input.deviceId);
  const now = new Date().toISOString();
  const record: DeviceCommandRecord = {
    id: randomUUID(),
    sortNo: records.length + 1,
    deviceId: input.deviceId,
    deviceName: device?.name,
    commandType: input.commandType,
    commandContent: input.commandContent ?? input.commandType,
    payloadSummary: input.payload ? JSON.stringify(input.payload).slice(0, 180) : undefined,
    payload: input.payload,
    response: input.response,
    responseContent: input.response ? "OK" : undefined,
    status: input.status ?? "PENDING",
    progress: input.progress ?? (input.status === "SUCCESS" || input.status === "EXECUTED" ? 100 : 0),
    submittedReservedCommand: input.submittedReservedCommand ?? input.status === "RESERVED",
    operatorId: input.operatorId,
    operator: input.operator ?? "Mock operator",
    executionTime: ["SUCCESS", "EXECUTED"].includes(input.status ?? "") ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };
  writeRecords([record, ...records]);
  return record;
}

export function listCommandRecords(filters: { deviceId?: string; deviceName?: string; type?: string; status?: string; content?: string; operator?: string; startDate?: string; endDate?: string }) {
  const records = readRecords();
  const content = filters.content?.trim().toLowerCase();
  const deviceName = filters.deviceName?.trim().toLowerCase();
  const operator = filters.operator?.trim().toLowerCase();
  const start = filters.startDate ? new Date(filters.startDate).getTime() : undefined;
  const end = filters.endDate ? new Date(filters.endDate).getTime() : undefined;
  return records.filter((command) => {
    const created = new Date(command.createdAt).getTime();
    return (
      (!filters.deviceId || command.deviceId.includes(filters.deviceId)) &&
      (!deviceName || (command.deviceName ?? "").toLowerCase().includes(deviceName)) &&
      (!filters.type || command.commandType === filters.type) &&
      (!filters.status || command.status === filters.status) &&
      (!operator || (command.operator ?? "").toLowerCase().includes(operator)) &&
      (!start || created >= start) &&
      (!end || created <= end) &&
      (!content || (command.commandContent ?? "").toLowerCase().includes(content) || (command.payloadSummary ?? "").toLowerCase().includes(content))
    );
  });
}

export function getCommandRecord(commandId: string) {
  const command = readRecords().find((item) => item.id === commandId);
  if (!command) {
    const error = new Error("Command not found");
    Object.assign(error, { statusCode: 404, code: "CONTROL_COMMAND_NOT_FOUND" });
    throw error;
  }
  return command;
}

export function cancelCommandRecord(commandId: string, userId?: string) {
  const records = readRecords();
  const command = getCommandRecord(commandId);
  if (!["PENDING", "RESERVED"].includes(command.status)) {
    const error = new Error("Only pending or reserved commands can be cancelled");
    Object.assign(error, { statusCode: 409, code: "CONTROL_COMMAND_NOT_CANCELLABLE" });
    throw error;
  }
  command.status = "CANCELLED";
  command.progress = 100;
  command.updatedAt = new Date().toISOString();
  writeRecords(records.map((item) => (item.id === commandId ? command : item)));
  auditControlAction({ action: "CMD_CANCEL", deviceId: command.deviceId, commandId, userId });
  return command;
}

export function resendCommandRecord(commandId: string, userId?: string) {
  const original = getCommandRecord(commandId);
  const command = createCommandRecord({
    deviceId: original.deviceId,
    commandType: original.commandType,
    commandContent: `Resend ${original.commandContent ?? original.commandType}`,
    payload: original.payload,
    operatorId: userId,
    status: original.status === "RESERVED" ? "RESERVED" : "PENDING",
    submittedReservedCommand: original.submittedReservedCommand,
  });
  auditControlAction({ action: "CMD_RESEND", deviceId: command.deviceId, commandId: command.id, userId });
  return command;
}

export function deleteCommandRecord(commandId: string, userId?: string) {
  const records = readRecords();
  const command = getCommandRecord(commandId);
  writeRecords(records.filter((item) => item.id !== commandId));
  auditControlAction({ action: "CMD_DELETE", deviceId: command.deviceId, commandId, userId });
  return { deleted: true };
}
