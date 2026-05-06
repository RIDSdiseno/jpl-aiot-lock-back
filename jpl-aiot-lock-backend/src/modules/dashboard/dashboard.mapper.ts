import type { DashboardOperationRatio } from "./dashboard.types";

export function buildOperationRatio(devices: Array<{ status: string }>): DashboardOperationRatio {
  const online = devices.filter((device) => device.status.toLowerCase() === "online").length;
  const offline = devices.filter((device) => device.status.toLowerCase() === "offline").length;
  const alarm = devices.filter((device) => device.status.toLowerCase() === "alarm").length;

  return {
    total: devices.length,
    online,
    offline,
    alarm,
  };
}
