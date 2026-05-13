import type { ReportQueryParams, SortOrder } from "./report.types";

const ALLOWED_SORT_FIELDS = new Set(["sortNo", "deviceId", "deviceName", "productModel", "gpsTime", "event", "dataType", "createdAt"]);

export function parseReportQuery(query: Record<string, unknown>): ReportQueryParams {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? query.pageSize ?? 20);
  const sortOrder: SortOrder = String(query.sortOrder ?? "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
  const startDate = toStringOrUndefined(query.startDate) ?? defaultStartDate();
  const endDate = toStringOrUndefined(query.endDate) ?? new Date().toISOString();
  const sortBy = toStringOrUndefined(query.sortBy);

  if (Number.isNaN(new Date(startDate).getTime())) {
    throw validationError("Invalid startDate");
  }
  if (Number.isNaN(new Date(endDate).getTime())) {
    throw validationError("Invalid endDate");
  }
  if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
    throw validationError("startDate must be before endDate");
  }
  if (sortBy && !ALLOWED_SORT_FIELDS.has(sortBy)) {
    throw validationError("Invalid sortBy");
  }

  return {
    productModel: sanitizeText(query.productModel),
    deviceId: sanitizeDeviceId(query.deviceId),
    sealUnsealType: sanitizeText(query.sealUnsealType),
    startDate,
    endDate,
    dataType: sanitizeText(query.dataType),
    sortBy,
    sortOrder,
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    limit: Number.isFinite(limit) && limit >= 1 ? Math.min(Math.floor(limit), 100) : 20,
  };
}

function defaultStartDate() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

function toStringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function sanitizeText(value: unknown) {
  const text = toStringOrUndefined(value);
  return text?.replace(/[<>]/g, "");
}

function sanitizeDeviceId(value: unknown) {
  const text = toStringOrUndefined(value);
  return text?.replace(/[^\w.-]/g, "");
}

function validationError(message: string) {
  console.log("[REPORT][FILTER_VALIDATION_ERROR]", { message });
  return Object.assign(new Error(message), { statusCode: 400 });
}
