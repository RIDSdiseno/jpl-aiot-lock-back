import { createCommandRecord } from "../commands/command-record.service";
import { auditControlAction } from "../shared/control-audit.service";
import { findControlDevice } from "../shared/control-device-selector.service";
import type { DynamicPasswordResponse } from "./password.types";

const passwordsByDevice = new Map<string, { password: string; generatedAt: string }>([
  ["553071206110", { password: "839204", generatedAt: new Date().toISOString() }],
]);

export function getDynamicPassword(deviceId: string, canReveal: boolean, userId?: string): DynamicPasswordResponse {
  if (!findControlDevice(deviceId)) {
    const error = new Error("Device not found");
    Object.assign(error, { statusCode: 404, code: "CONTROL_DEVICE_NOT_FOUND" });
    throw error;
  }

  const password = passwordsByDevice.get(deviceId);
  if (canReveal) {
    auditControlAction({ action: "PASSWORD_REVEAL", deviceId, userId, metadata: { result: password ? "VISIBLE" : "EMPTY" } });
  }

  return {
    deviceId,
    hasPassword: Boolean(password),
    password: canReveal ? password?.password : undefined,
    generatedAt: password?.generatedAt,
    warning: "Do not reveal the password to non-elock operators.",
  };
}

export function updateDynamicPassword(deviceId: string, userId?: string): DynamicPasswordResponse {
  const device = findControlDevice(deviceId);
  if (!device) {
    const error = new Error("Device not found");
    Object.assign(error, { statusCode: 404, code: "CONTROL_DEVICE_NOT_FOUND" });
    throw error;
  }

  const password = String(Math.floor(10000000 + Math.random() * 90000000));
  const generatedAt = new Date().toISOString();
  passwordsByDevice.set(deviceId, { password, generatedAt });
  createCommandRecord({
    deviceId,
    commandType: "PASSWORD_UPDATE",
    commandContent: "Update unlock dynamic password",
    status: device.isOnline ? "SUCCESS" : "RESERVED",
    progress: device.isOnline ? 100 : 0,
    payload: { source: "mock-device" },
    response: { generatedAt },
    operatorId: userId,
    submittedReservedCommand: !device.isOnline,
  });
  auditControlAction({ action: "PASSWORD_UPDATE", deviceId, userId, metadata: { generatedAt } });
  return getDynamicPassword(deviceId, true, userId);
}
