export type EventSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface EventQueryParams {
  productModel?: string;
  deviceId?: string;
  gpsTimeFrom?: string;
  gpsTimeTo?: string;
  eventType?: string;
  alarmEvent?: string;
  dataType?: string;
  affiliatedCompany?: string;
  sendTimeFrom?: string;
  sendTimeTo?: string;
  page?: number;
  pageSize?: number;
}

export interface DeviceEventItem {
  id: string;
  sortNo?: number;
  deviceId: string;
  deviceName?: string;
  productModel?: string;
  gpsTime?: string;
  batteryLevel?: number;
  events?: string;
  eventType: string;
  lockStatus?: string;
  dataType?: string;
  latitude?: number;
  longitude?: number;
  locationText?: string;
  operatingInfo?: string;
  severity?: EventSeverity;
  rawPayload?: unknown;
  createdAt: string;
}

export interface AlarmEventItem {
  id: string;
  sortNo?: number;
  deviceId: string;
  deviceName?: string;
  productModel?: string;
  gpsTime?: string;
  batteryLevel?: number;
  alarmEvent: string;
  alarmReason?: string;
  operatingInfo?: string;
  lockStatus?: string;
  dataType?: string;
  latitude?: number;
  longitude?: number;
  locationText?: string;
  severity: EventSeverity;
  handledStatus?: "NEW" | "ACKNOWLEDGED" | "RESOLVED" | "IGNORED";
  createdAt: string;
}

export interface PushEventItem {
  id: string;
  sortNo?: number;
  deviceId: string;
  affiliatedCompany: string;
  pushType: "E-mail" | "SMS" | "Webhook" | string;
  sendingEventType: string;
  sendTo: string;
  sendingStatus: "PENDING" | "SENT" | "FAILED" | "UNKNOWN" | string;
  sendingContent: string;
  sendTime: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
