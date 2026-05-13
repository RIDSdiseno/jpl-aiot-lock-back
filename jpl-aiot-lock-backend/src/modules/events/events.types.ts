export type EventSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlarmStatus = "NEW" | "REVIEWED" | "RESOLVED" | "DISMISSED";
export type SortOrder = "ASC" | "DESC";

export interface EventQueryParams {
  productModel?: string;
  deviceId?: string;
  startDate?: string;
  endDate?: string;
  eventType?: string;
  alarmType?: string;
  dataType?: string;
  affiliatedCompany?: string;
  pushType?: string;
  sendingStatus?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface DeviceEventItem {
  id: string;
  sortNo?: number;
  deviceId: string;
  deviceName?: string;
  productModel?: string;
  gpsTime?: string;
  batteryLevel?: number;
  eventName?: string;
  events?: string;
  eventType: string;
  lockStatus?: string;
  dataType?: string;
  latitude?: number;
  longitude?: number;
  locationText?: string;
  eventImageUrl?: string | null;
  description?: string;
  operatingInfo?: string;
  source?: string;
  severity?: EventSeverity;
  rawPayload?: unknown;
  createdAt: string;
}

export interface AlarmEventItem {
  id: string;
  eventId?: string;
  sortNo?: number;
  deviceId: string;
  deviceName?: string;
  productModel?: string;
  gpsTime?: string;
  batteryLevel?: number;
  alarmType: string;
  alarmEvent?: string;
  alarmLevel: Exclude<EventSeverity, "INFO">;
  alarmReason?: string;
  operatingInfo?: string;
  lockStatus?: string;
  dataType?: string;
  latitude?: number;
  longitude?: number;
  locationText?: string;
  eventImageUrl?: string | null;
  description?: string;
  status: AlarmStatus;
  severity?: EventSeverity;
  handledStatus?: AlarmStatus;
  rawPayload?: unknown;
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
  rawPayload?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LegacyPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
