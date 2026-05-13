import type { EventQueryParams, SortOrder } from "./events.types";

export function parseEventQuery(query: Record<string, unknown>): EventQueryParams {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? query.pageSize ?? 20);
  const sortOrder: SortOrder = String(query.sortOrder ?? "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
  const parsedStartDate = toStringOrUndefined(query.startDate) ?? toStringOrUndefined(query.gpsTimeFrom) ?? toStringOrUndefined(query.sendTimeFrom);
  const parsedEndDate = toStringOrUndefined(query.endDate) ?? toStringOrUndefined(query.gpsTimeTo) ?? toStringOrUndefined(query.sendTimeTo);
  const endDate = parsedEndDate ?? new Date().toISOString();
  const startDate = parsedStartDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  if (startDate && Number.isNaN(new Date(startDate).getTime())) {
    throw Object.assign(new Error("Invalid startDate"), { statusCode: 400, logCode: "[EVENT][FILTER_VALIDATION_ERROR]" });
  }
  if (endDate && Number.isNaN(new Date(endDate).getTime())) {
    throw Object.assign(new Error("Invalid endDate"), { statusCode: 400, logCode: "[EVENT][FILTER_VALIDATION_ERROR]" });
  }
  if (startDate && endDate && new Date(startDate).getTime() > new Date(endDate).getTime()) {
    throw Object.assign(new Error("startDate must be before endDate"), { statusCode: 400, logCode: "[EVENT][FILTER_VALIDATION_ERROR]" });
  }

  return {
    productModel: toStringOrUndefined(query.productModel),
    deviceId: sanitizeDeviceId(query.deviceId),
    startDate,
    endDate,
    eventType: toStringOrUndefined(query.eventType),
    alarmType: toStringOrUndefined(query.alarmType) ?? toStringOrUndefined(query.alarmEvent),
    dataType: toStringOrUndefined(query.dataType),
    affiliatedCompany: toStringOrUndefined(query.affiliatedCompany),
    pushType: toStringOrUndefined(query.pushType),
    sendingStatus: toStringOrUndefined(query.sendingStatus),
    sortBy: toStringOrUndefined(query.sortBy),
    sortOrder,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20,
  };
}

function toStringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function sanitizeDeviceId(value: unknown) {
  const text = toStringOrUndefined(value);
  if (!text) return undefined;
  return text.replace(/[^\w.-]/g, "");
}

export function toCsv<T extends object>(items: T[], columns: Array<keyof T>) {
  const rows = [columns.join(",")];

  for (const item of items) {
    rows.push(
      columns
        .map((column) => {
          const value = item[column] ?? "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(","),
    );
  }

  return rows.join("\n");
}
