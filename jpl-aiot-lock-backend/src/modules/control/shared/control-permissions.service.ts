import type { Request } from "express";

export type ControlPermission =
  | "CONTROL_VIEW"
  | "CONTROL_NFC_VIEW"
  | "CONTROL_NFC_READ"
  | "CONTROL_NFC_ADD"
  | "CONTROL_NFC_SYNC"
  | "CONTROL_NFC_CLEAR"
  | "CONTROL_NFC_RESERVE_COMMAND"
  | "CONTROL_PASSWORD_VIEW"
  | "CONTROL_PASSWORD_REVEAL"
  | "CONTROL_CMD_RECORD_VIEW"
  | "CONTROL_CMD_RECORD_CANCEL"
  | "CONTROL_PARAMETER_VIEW"
  | "CONTROL_PARAMETER_READ"
  | "CONTROL_PARAMETER_UPDATE"
  | "CONTROL_PARAMETER_RESERVE_COMMAND"
  | "CONTROL_PARAMETER_VIEW_SENSITIVE";

export function hasControlPermission(_req: Request, _permission: ControlPermission) {
  return true;
}

export function requireControlPermission(req: Request, permission: ControlPermission) {
  if (!hasControlPermission(req, permission)) {
    const error = new Error("Insufficient permissions");
    Object.assign(error, { statusCode: 403, code: "CONTROL_FORBIDDEN" });
    throw error;
  }
}
