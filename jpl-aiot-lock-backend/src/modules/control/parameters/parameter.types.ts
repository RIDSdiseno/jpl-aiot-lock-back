export type ParameterValue = string | number | boolean | null;
export type ParameterCategoryKey =
  | "COMMUNICATION"
  | "TIME"
  | "SHACKLE"
  | "INSTRUCTION_SET"
  | "BLUETOOTH"
  | "LOCATION"
  | "POWER_SUPPLY"
  | "SENSOR"
  | "IC_CARD"
  | "STORAGE"
  | "OTA";

export type ParameterFieldType = "text" | "number" | "boolean" | "select" | "password" | "datetime" | "readonly";
export type ParameterCommandStatus = "PENDING" | "SUCCESS" | "FAILED" | "OFFLINE" | "RESERVED";
export type ParameterSnapshotSource = "READ" | "UPDATE_RESULT" | "MOCK" | "DEVICE_REPORT";
export type ParameterCommandType = "READ_PARAMETERS" | "UPDATE_PARAMETERS" | "RESERVED_UPDATE_PARAMETERS";
export type ParameterDeviceStatus = "ONLINE" | "OFFLINE" | "SLEEP";

export interface ParameterOption {
  label: string;
  value: string | number | boolean;
}

export interface ParameterDefinition {
  key: string;
  label: string;
  category: ParameterCategoryKey;
  type: ParameterFieldType;
  value?: ParameterValue;
  placeholder?: string;
  unit?: string;
  options?: ParameterOption[];
  editable: boolean;
  sensitive?: boolean;
  min?: number;
  max?: number;
  description?: string;
  group?: string;
  required?: boolean;
}

export interface ParameterField extends ParameterDefinition {
  value?: ParameterValue;
}

export interface ParameterUpdateInput {
  key: string;
  value: ParameterValue;
}

export interface ParameterSnapshot {
  id: string;
  deviceId: string;
  source: ParameterSnapshotSource;
  parameters: Record<ParameterCategoryKey, ParameterField[]>;
  readAt: string;
  createdById?: string;
  createdAt: string;
}

export interface ParameterCommand {
  id: string;
  deviceId: string;
  commandType: ParameterCommandType;
  status: ParameterCommandStatus;
  requestedPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  errorMessage?: string;
  requestedById?: string;
  requestedAt: string;
  completedAt?: string;
  reservedFor?: string;
}

export interface ParameterDevice {
  id: string;
  name: string;
  imei?: string;
  code?: string;
  type?: string;
  companyName: string;
  status: ParameterDeviceStatus;
  battery?: number;
  lastSeenAt?: string;
}

export interface ParameterGatewayResult {
  ok: true;
  status: "SUCCESS" | "PENDING";
  commandId: string;
  parameters?: Record<ParameterCategoryKey, ParameterField[]>;
  readAt: string;
}

export interface ParameterDeviceFilters {
  status?: "ALL" | "ONLINE" | "OFFLINE" | "SLEEP" | "all" | "online" | "offline" | "sleep";
  type?: string;
  search?: string;
}

export type ParameterErrorCode =
  | "DEVICE_NOT_FOUND"
  | "DEVICE_OFFLINE"
  | "DEVICE_SLEEP"
  | "PARAMETER_NOT_ALLOWED"
  | "INVALID_PARAMETER_VALUE"
  | "COMMAND_TIMEOUT"
  | "IOT_GATEWAY_ERROR";

export class ParameterError extends Error {
  code: ParameterErrorCode;
  statusCode: number;

  constructor(code: ParameterErrorCode, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
