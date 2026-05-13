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
  | "SENDING"
  | "SUCCESS"
  | "RESERVED"
  | "SENT"
  | "RECEIVED"
  | "EXECUTED"
  | "FAILED"
  | "TIMEOUT"
  | "CANCELLED"
  | "EXPIRED";

export interface DeviceCommandRecord {
  id: string;
  sortNo?: number;
  deviceId: string;
  deviceName?: string;
  commandContent?: string;
  commandType: string;
  status: DeviceCommandStatus;
  progress?: number;
  payloadSummary?: string;
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
  executionTime?: string;
  responseContent?: string;
  submittedReservedCommand?: boolean;
  operator?: string;
  operatorId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DeviceParameterField {
  key: string;
  label: string;
  value?: string | number | boolean | null;
  type?: "text" | "number" | "boolean" | "select" | "password" | "datetime" | "readonly";
  unit?: string;
  options?: Array<{ label: string; value: string | number | boolean }>;
  editable?: boolean;
  description?: string;
  placeholder?: string;
  sensitive?: boolean;
  min?: number;
  max?: number;
  group?: string;
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
