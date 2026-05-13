export type SortOrder = "ASC" | "DESC";

export interface ReportQueryParams {
  productModel?: string;
  deviceId?: string;
  sealUnsealType?: string;
  startDate?: string;
  endDate?: string;
  dataType?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  page: number;
  limit: number;
}

export interface LockUnlockReportItem {
  id: string;
  sortNo?: number;
  deviceId: string;
  deviceName?: string;
  productModel?: string;
  gpsTime?: string;
  event: string;
  eventType?: string;
  operatingInfo?: string;
  dataType?: string;
  eventImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  operateUser?: string;
  description?: string;
  source?: string;
  rawPayload?: unknown;
  createdAt?: string;
}

export interface PaginatedReportResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    applied: Partial<ReportQueryParams>;
  };
}

export interface ReportOptions {
  productModels: string[];
  productTypes: string[];
  operationTypes: string[];
  sealUnsealTypes: string[];
  dataTypes: string[];
  fenceEvents: string[];
  userLogActions: string[];
}
