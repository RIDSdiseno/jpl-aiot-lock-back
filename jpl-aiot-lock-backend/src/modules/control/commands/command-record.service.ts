import { randomUUID } from "crypto";
import type { DeviceCommandRecord } from "../control.types";
import { auditControlAction } from "../shared/control-audit.service";

const commandRecords: DeviceCommandRecord[] = [
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
  },
];

export function listCommandRecords(filters: { deviceId?: string; type?: string; status?: string; content?: string }) {
  const content = filters.content?.trim().toLowerCase();
  return commandRecords.filter((command) => {
    return (
      (!filters.deviceId || command.deviceId.includes(filters.deviceId)) &&
      (!filters.type || command.commandType === filters.type) &&
      (!filters.status || command.status === filters.status) &&
      (!content || (command.commandContent ?? "").toLowerCase().includes(content))
    );
  });
}

export function getCommandRecord(commandId: string) {
  const command = commandRecords.find((item) => item.id === commandId);
  if (!command) {
    const error = new Error("Command not found");
    Object.assign(error, { statusCode: 404, code: "CONTROL_COMMAND_NOT_FOUND" });
    throw error;
  }
  return command;
}

export function cancelCommandRecord(commandId: string, userId?: string) {
  const command = getCommandRecord(commandId);
  if (!["PENDING", "RESERVED"].includes(command.status)) {
    const error = new Error("Only pending or reserved commands can be cancelled");
    Object.assign(error, { statusCode: 409, code: "CONTROL_COMMAND_NOT_CANCELLABLE" });
    throw error;
  }
  command.status = "CANCELLED";
  auditControlAction({ action: "CMD_CANCEL", deviceId: command.deviceId, commandId, userId });
  return command;
}
