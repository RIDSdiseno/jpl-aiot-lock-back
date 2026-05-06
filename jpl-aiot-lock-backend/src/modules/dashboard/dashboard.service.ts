import { buildOperationRatio } from "./dashboard.mapper";
import type {
  DashboardAlarmEvent,
  DashboardLockUnlockTrendPoint,
  DashboardQuickAccessItem,
  DashboardSummary,
  DashboardSystemMessage,
} from "./dashboard.types";

const demoDevices = [
  { id: "1", deviceId: "198065617508", type: "SMART_LOCK", status: "online" },
  { id: "2", deviceId: "198065617509", type: "SMART_LOCK", status: "offline" },
  { id: "3", deviceId: "198065617510", type: "SMART_LOCK", status: "offline" },
  { id: "4", deviceId: "198065617511", type: "SMART_LOCK", status: "offline" },
  { id: "5", deviceId: "198065617512", type: "SMART_LOCK", status: "offline" },
  { id: "6", deviceId: "198065617513", type: "SMART_LOCK", status: "offline" },
];

const systemMessages: DashboardSystemMessage[] = [];

const alarmEvents: DashboardAlarmEvent[] = [
  {
    id: "alarm-demo-001",
    deviceId: "198065617508",
    occurredAt: "2024-01-31T10:47:55.000Z",
    alarmType: "Low battery threshold alarm",
    description: "Low battery threshold alarm",
    severity: "WARNING",
  },
];

const quickAccess: DashboardQuickAccessItem[] = [
  { id: "monitoring", label: "Monitoreo", path: "/app/monitoreo", permission: "MONITORING_VIEW" },
  { id: "control", label: "Control", path: "/app/control" },
  { id: "gis", label: "GIS / Geocercas", path: "/app/gis", permission: "MONITORING_VIEW_GEOFENCE" },
  { id: "events", label: "Eventos", path: "/app/eventos" },
  { id: "reports", label: "Reportes", path: "/app/reportes" },
  { id: "devices", label: "Dispositivos", path: "/app/dispositivos" },
  { id: "history", label: "Historial", path: "/app/historial" },
  { id: "maintenance", label: "Mantenimiento", path: "/app/mantenimiento" },
  { id: "users", label: "Centro de Usuarios", path: "/app/usuarios" },
];

function buildTrend(from?: string, to?: string): DashboardLockUnlockTrendPoint[] {
  const start = from ? new Date(from) : new Date("2024-01-25T00:00:00.000Z");
  const end = to ? new Date(to) : new Date("2024-01-31T00:00:00.000Z");
  const days = Math.max(1, Math.min(31, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1));

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      seal: 2 + (index % 4),
      unseal: 1 + ((index + 1) % 3),
    };
  });
}

export function getDeviceTypeSummary() {
  return {
    smartLock: demoDevices.filter((device) => device.type === "SMART_LOCK").length,
    smartSensor: 0,
    gpsTracker: 0,
    eSeal: 0,
    smartGateway: 0,
    smartBox: 0,
  };
}

export function getOperationRatio() {
  return buildOperationRatio(demoDevices);
}

export function getSystemMessages() {
  return systemMessages;
}

export function getAlarmEvents() {
  return alarmEvents;
}

export function getLockUnlockTrend(from?: string, to?: string) {
  return buildTrend(from, to);
}

export function getQuickAccess() {
  return quickAccess;
}

export function getSummary(from?: string, to?: string): DashboardSummary {
  return {
    deviceTypes: getDeviceTypeSummary(),
    operationRatio: getOperationRatio(),
    systemMessages: getSystemMessages(),
    alarmEvents: getAlarmEvents(),
    lockUnlockTrend: getLockUnlockTrend(from, to),
    quickAccess: getQuickAccess(),
  };
}
