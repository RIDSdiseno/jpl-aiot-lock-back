import type { ControlAuditEntry } from "../control.types";

const auditEntries: ControlAuditEntry[] = [];

export function auditControlAction(entry: Omit<ControlAuditEntry, "createdAt">) {
  auditEntries.unshift({ ...entry, createdAt: new Date().toISOString() });
}

export function getControlAuditEntries() {
  return auditEntries;
}
