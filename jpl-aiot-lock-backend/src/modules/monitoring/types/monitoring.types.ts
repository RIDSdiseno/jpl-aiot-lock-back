import {
  CompanyStatus,
  LockConnectionStatus,
  LockConnectionType,
  LockStatus,
} from "@prisma/client";
import { MONITORING_DEVICE_TYPE_VALUES } from "../constants/monitoring.constants";

export type MonitoringStatusFilter = LockConnectionStatus | "ALL" | "ALARM";

export type MonitoringDeviceType = (typeof MONITORING_DEVICE_TYPE_VALUES)[number];

export type MonitoringCurrentUser = {
  userId?: string;
  id?: string;
  role?: string;
  companyId?: string | null;
};

export type MonitoringDevicesQuery = {
  status?: MonitoringStatusFilter;
  search?: string;
  companyId?: string;
  type?: MonitoringDeviceType;
};

export type MonitoringGeofencesQuery = {
  companyId?: string;
  active?: boolean;
};

export type MonitoringSummaryResponse = {
  total: number;
  online: number;
  offline: number;
  sleep: number;
  lostSignal: number;
  unknown: number;
  alarm: number;
};

export type MonitoringDeviceItem = {
  id: string;
  name: string;
  internalCode: string;
  serialNumber: string | null;
  imei: string | null;
  macAddress: string | null;
  type: MonitoringDeviceType;
  status: LockStatus;
  connectionStatus: LockConnectionStatus;
  connectionType: LockConnectionType;
  batteryLevel: number | null;
  signalLevel: number | null;
  lastConnectionAt: Date | null;
  lastSyncAt: Date | null;
  company: {
    id: string;
    name: string;
  } | null;
  branch: {
    id: string;
    name: string;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    recordedAt: Date;
  } | null;
  hasOpenAlert: boolean;
  openAlertCount: number;
};

export type MonitoringGeofenceItem = {
  id: string;
  name: string;
  description: string | null;
  centerLat: number;
  centerLng: number;
  radiusMt: number;
  isActive: boolean;
  company: {
    id: string;
    name: string;
  };
};

export type MonitoringCompanyTreeItem = {
  id: string;
  name: string;
  status?: CompanyStatus;
  totalDevices: number;
  online: number;
  offline: number;
  sleep: number;
  alarm: number;
  devices: Array<{
    id: string;
    name: string;
    internalCode: string;
    type: MonitoringDeviceType;
    connectionStatus: LockConnectionStatus;
    batteryLevel: number | null;
    signalLevel: number | null;
    hasLocation: boolean;
  }>;
};
