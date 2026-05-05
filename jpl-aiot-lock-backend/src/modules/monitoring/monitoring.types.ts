import { CommandStatus, LockConnectionStatus } from "@prisma/client";

export type MonitoringStatusFilter = "all" | "online" | "offline" | "alarm";

export type MonitoringCurrentUser = {
  userId?: string;
  id?: string;
  role?: string;
  companyId?: string | null;
};

export type MonitoringDeviceStatus = "online" | "offline" | "alarm";

export type MonitoringDevice = {
  id: string;
  deviceId: string;
  name: string;
  companyId: string;
  companyName: string;
  status: MonitoringDeviceStatus;
  connectionStatus: LockConnectionStatus;
  battery: number;
  signal: number;
  latitude: number;
  longitude: number;
  connectionMode: string;
  deviceStatus: string;
  speed: number;
  sim: string;
  lockStatus: "sealed" | "unsealed";
  shackleStatus: "closed" | "open";
  alarmStatus: string;
  events: string[];
  positioningTime: string;
  location: string;
  lastSeenAt: string;
};

export type MonitoringTrajectoryPoint = {
  latitude: number;
  longitude: number;
  speed: number;
  recordedAt: string;
};

export type MonitoringGeoFence = {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  type: "circle";
  centerLat: number;
  centerLng: number;
  radiusMt: number;
  isActive: boolean;
};

export type MonitoringCommandResult = {
  commandId: string;
  deviceId: string;
  command: string;
  status: CommandStatus;
  queued: boolean;
  message: string;
  createdAt: string;
};

export type MonitoringDeviceParameters = {
  heartbeatSeconds: number;
  gpsIntervalSeconds: number;
  overspeedLimitKmh: number;
  alarmEnabled: boolean;
};

export type NfcCard = {
  id: string;
  cardNo: string;
  holder: string;
  status: "active" | "inactive";
  syncedAt?: string | null;
};
