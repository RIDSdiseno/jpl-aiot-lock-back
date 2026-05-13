import { eventRepository } from "../../event.repository";
import type { EventQueryParams } from "../../events.types";

export function listPushHistory(params: EventQueryParams) {
  return eventRepository.listPush().filter((item) => {
    return (
      includes(item.deviceId, params.deviceId) &&
      includes(item.affiliatedCompany, params.affiliatedCompany) &&
      includes(item.pushType, params.pushType) &&
      includes(item.sendingStatus, params.sendingStatus) &&
      inDateRange(item.sendTime, params.startDate, params.endDate)
    );
  });
}

function includes(value?: string, filter?: string) {
  if (!filter) return true;
  return (value ?? "").toLowerCase().includes(filter.toLowerCase());
}

function inDateRange(value?: string, from?: string, to?: string) {
  if (!value) return true;
  const time = new Date(value).getTime();
  if (from && time < new Date(from).getTime()) return false;
  if (to && time > new Date(to).getTime()) return false;
  return true;
}
