export interface DashboardDeviceTypes {
  smartLock: number;
  smartSensor: number;
  gpsTracker: number;
  eSeal: number;
  smartGateway: number;
  smartBox: number;
}

export interface DashboardOperationRatio {
  total: number;
  online: number;
  offline: number;
  alarm: number;
}

export interface DashboardSystemMessage {
  id: string;
  title: string;
  message: string;
  level: "INFO" | "WARNING" | "CRITICAL";
  createdAt: string;
}

export interface DashboardAlarmEvent {
  id: string;
  deviceId: string;
  occurredAt: string;
  alarmType: string;
  description: string;
  severity?: string | null;
}

export interface DashboardLockUnlockTrendPoint {
  date: string;
  seal: number;
  unseal: number;
}

export interface DashboardQuickAccessItem {
  id: string;
  label: string;
  path: string;
  permission?: string;
}

export interface DashboardSummary {
  deviceTypes: DashboardDeviceTypes;
  operationRatio: DashboardOperationRatio;
  systemMessages: DashboardSystemMessage[];
  alarmEvents: DashboardAlarmEvent[];
  lockUnlockTrend: DashboardLockUnlockTrendPoint[];
  quickAccess: DashboardQuickAccessItem[];
}
