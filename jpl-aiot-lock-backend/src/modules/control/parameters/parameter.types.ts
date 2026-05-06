import type { DeviceParameterField } from "../control.types";

export interface DeviceParameterSnapshot {
  id: string;
  deviceId: string;
  category: string;
  parameters: DeviceParameterField[];
  readAt: string;
  rawPayload?: Record<string, unknown>;
}
