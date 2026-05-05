import { getDeviceById } from "./monitoring.service";

export async function getDeviceTelemetry(deviceId: string) {
  const device = await getDeviceById(deviceId);
  return {
    battery: device.battery,
    signal: device.signal,
    speed: device.speed,
    sim: device.sim,
    events: device.events,
    positioningTime: device.positioningTime,
  };
}
