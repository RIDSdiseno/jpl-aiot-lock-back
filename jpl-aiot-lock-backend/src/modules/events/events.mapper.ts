export function parseEventQuery(query: Record<string, unknown>) {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 20);

  return {
    productModel: toStringOrUndefined(query.productModel),
    deviceId: toStringOrUndefined(query.deviceId),
    gpsTimeFrom: toStringOrUndefined(query.gpsTimeFrom),
    gpsTimeTo: toStringOrUndefined(query.gpsTimeTo),
    eventType: toStringOrUndefined(query.eventType),
    alarmEvent: toStringOrUndefined(query.alarmEvent),
    dataType: toStringOrUndefined(query.dataType),
    affiliatedCompany: toStringOrUndefined(query.affiliatedCompany),
    sendTimeFrom: toStringOrUndefined(query.sendTimeFrom),
    sendTimeTo: toStringOrUndefined(query.sendTimeTo),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20,
  };
}

function toStringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
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
