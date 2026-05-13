import { reportRepository } from "./report.repository";
import { mapDeviceEventToLockUnlockReport } from "./reports/reportMapper.service";
import type { LockUnlockReportItem, PaginatedReportResponse, ReportOptions, ReportQueryParams } from "./report.types";

export async function listLockUnlock(params: ReportQueryParams): Promise<PaginatedReportResponse<LockUnlockReportItem>> {
  console.log("[REPORT][LOCK_UNLOCK_LIST]", compactLog(params));
  const sourceItems = await reportRepository.listLockUnlockEvents(params);
  const filtered = sourceItems
    .map(mapDeviceEventToLockUnlockReport)
    .filter((item) => (
      includes(item.productModel, params.productModel) &&
      includes(item.deviceId, params.deviceId) &&
      includes(item.operatingInfo, params.sealUnsealType) &&
      includes(item.dataType, params.dataType) &&
      inDateRange(item.gpsTime, params.startDate, params.endDate)
    ));

  return paginate(sortItems(filtered, params), params);
}

export async function getLockUnlockDetail(id: string) {
  console.log("[REPORT][DETAIL]", { reportType: "lock-unlock", id });
  const event = await reportRepository.findLockUnlockEventById(id);
  return event ? mapDeviceEventToLockUnlockReport(event) : null;
}

export function getReportOptions(): ReportOptions {
  console.log("[REPORT][OPTIONS_LOAD]");
  return {
    productModels: ["G300N", "G500N"],
    productTypes: ["G_Lock"],
    operationTypes: ["Seal", "Unseal", "Lock", "Unlock", "Fence seal", "Fence unseal"],
    sealUnsealTypes: [
      "APP seal success",
      "APP unseal success",
      "BLE-sealing success",
      "BLE-unsealing success",
      "BLE unlock success",
      "Remote lock success",
      "Remote unlock success",
      "Seal failed",
      "Unseal failed",
    ],
    dataTypes: ["Real-time", "Supplementary", "Offline", "Historical", "Alarm", "Command response"],
    fenceEvents: ["Enter fence", "Exit fence", "Inside fence", "Outside fence", "Fence violation", "Fence timeout"],
    userLogActions: ["LOGIN", "LOGOUT", "READ_DEVICE", "UPDATE_PARAMETER", "SEND_COMMAND", "EXPORT_REPORT", "VIEW_EVENT", "RESOLVE_ALARM"],
  };
}

function paginate<T>(items: T[], params: ReportQueryParams): PaginatedReportResponse<T> {
  const start = (params.page - 1) * params.limit;
  const totalPages = Math.ceil(items.length / params.limit);
  return {
    data: items.slice(start, start + params.limit).map((item, index) => ({ ...item, sortNo: start + index + 1 })),
    pagination: { page: params.page, limit: params.limit, total: items.length, totalPages },
    filters: { applied: compactLog(params) },
  };
}

function sortItems(items: LockUnlockReportItem[], params: ReportQueryParams) {
  if (!params.sortBy) return items;
  return [...items].sort((a, b) => {
    const left = a[params.sortBy as keyof LockUnlockReportItem];
    const right = b[params.sortBy as keyof LockUnlockReportItem];
    const direction = params.sortOrder === "ASC" ? 1 : -1;
    return String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true }) * direction;
  });
}

function includes(value?: string, filter?: string) {
  if (!filter) return true;
  return (value ?? "").toLowerCase().includes(filter.toLowerCase());
}

function inDateRange(value: string | undefined, from?: string, to?: string) {
  if (!value) return true;
  const time = new Date(value).getTime();
  if (from && time < new Date(from).getTime()) return false;
  if (to && time > new Date(to).getTime()) return false;
  return true;
}

function compactLog(params: ReportQueryParams) {
  return { ...params };
}
