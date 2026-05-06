export type GeoFenceType = "POLYGON" | "CIRCLE";
export type GeoFenceStatus = "DRAFT" | "ACTIVE" | "SENT" | "FAILED" | "INACTIVE";
export type FenceSendStatus = "PENDING" | "SENDING" | "SENT" | "FAILED" | "STOPPED" | "PARTIAL";
export type DeviceFenceQueryType = "CIRCLE_FENCE_LIST" | "POLYGON_FENCE_LIST" | "FENCE_RULE_LIST";

export interface FenceRuleInput {
  ruleType: string;
  enabled: boolean;
  value?: string;
  startTime?: string;
  endTime?: string;
  expiresAt?: string;
  description?: string;
}

export interface GeoFenceGeometry {
  center?: { lat: number; lng: number };
  radiusMeters?: number;
  points?: Array<{ lat: number; lng: number }>;
}

export interface GeoFenceInput {
  name: string;
  type: GeoFenceType;
  status?: GeoFenceStatus;
  geometry: GeoFenceGeometry;
  rules: FenceRuleInput[];
}

export interface SendFenceInput {
  geoFenceIds: string[];
  devices: Array<{ deviceId: string; deviceName?: string; status?: string }>;
}
