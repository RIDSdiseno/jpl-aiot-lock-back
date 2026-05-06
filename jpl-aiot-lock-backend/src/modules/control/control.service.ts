import { listControlDevices } from "./shared/control-device-selector.service";

export function getDevices(query: { status?: string; type?: string; search?: string }) {
  return listControlDevices(query.status ?? "all", query.type ?? "AllType", query.search ?? "");
}
