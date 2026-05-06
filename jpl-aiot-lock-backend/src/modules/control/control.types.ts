export type ControlDeviceStatus = "ONLINE" | "OFFLINE" | "SLEEP" | "ALARM";

export interface ControlDevice {
  id: string;
  deviceId: string;
  name?: string;
  companyId: string;
  companyName: string;
  model?: string;
  type?: string;
  status: ControlDeviceStatus;
  isOnline: boolean;
  isSleep?: boolean;
  hasActiveAlarm: boolean;
  alarmType?: string | null;
  selected?: boolean;
}

export interface ControlCompanyGroup {
  companyId: string;
  companyName: string;
  devices: ControlDevice[];
}

export type DeviceCommandStatus =
  | "PENDING"
  | "RESERVED"
  | "SENT"
  | "RECEIVED"
  | "EXECUTED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface DeviceCommandRecord {
  id: string;
  sortNo?: number;
  deviceId: string;
  commandContent?: string;
  commandType: string;
  status: DeviceCommandStatus;
  executionTime?: string;
  responseContent?: string;
  submittedReservedCommand?: boolean;
  operator?: string;
  createdAt: string;
}

export interface DeviceParameterField {
  key: string;
  label: string;
  value?: string;
  placeholder?: string;
  sensitive?: boolean;
  category: string;
}

export interface ControlAuditEntry {
  action: string;
  deviceId?: string;
  commandId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
