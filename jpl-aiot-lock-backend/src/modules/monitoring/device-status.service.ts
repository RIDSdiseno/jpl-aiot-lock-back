import { getDeviceById } from "./monitoring.service";

export async function getDeviceStatus(deviceId: string) {
  return getDeviceById(deviceId);
}
