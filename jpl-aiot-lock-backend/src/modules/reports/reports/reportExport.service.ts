import type { LockUnlockReportItem } from "../report.types";

const LOCK_UNLOCK_COLUMNS: Array<[keyof LockUnlockReportItem, string]> = [
  ["sortNo", "Sort No."],
  ["deviceId", "Device ID"],
  ["deviceName", "Device name"],
  ["productModel", "Product model"],
  ["gpsTime", "GPS Time"],
  ["event", "Event"],
  ["operatingInfo", "Operating info"],
  ["dataType", "Data type"],
  ["latitude", "Latitude"],
  ["longitude", "Longitude"],
  ["operateUser", "Operate user"],
  ["description", "Description"],
];

export function lockUnlockToCsv(items: LockUnlockReportItem[]) {
  const rows = [LOCK_UNLOCK_COLUMNS.map(([, label]) => label).join(",")];

  for (const item of items) {
    rows.push(
      LOCK_UNLOCK_COLUMNS.map(([key]) => csvValue(item[key])).join(","),
    );
  }

  return rows.join("\n");
}

function csvValue(value: unknown) {
  if (value === null || value === undefined || Number.isNaN(value)) return "\"\"";
  return `"${String(value).replace(/"/g, '""')}"`;
}
