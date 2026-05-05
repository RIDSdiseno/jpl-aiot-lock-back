import { LockConnectionStatus } from "@prisma/client";
import type { MonitoringDevice, MonitoringGeoFence } from "./monitoring.types";

export function normalizeStatus(status?: string) {
  const value = status?.toLowerCase();
  if (value === "online" || value === "offline" || value === "alarm") return value;
  return "all";
}

export function mapLegacyDevice(device: {
  id: string;
  name: string;
  internalCode: string;
  connectionStatus: LockConnectionStatus;
  batteryLevel: number | null;
  signalLevel: number | null;
  connectionType: string;
  company: { id: string; name: string } | null;
  location: { latitude: number; longitude: number; recordedAt: Date } | null;
  hasOpenAlert: boolean;
  openAlertCount: number;
  imei: string | null;
  status: string;
}): MonitoringDevice | null {
  if (!device.location || !device.company) return null;

  return {
    id: device.id,
    deviceId: device.internalCode,
    name: device.name,
    companyId: device.company.id,
    companyName: device.company.name,
    status: device.hasOpenAlert ? "alarm" : device.connectionStatus === "ONLINE" ? "online" : "offline",
    connectionStatus: device.connectionStatus,
    battery: device.batteryLevel ?? 0,
    signal: device.signalLevel ?? 0,
    latitude: device.location.latitude,
    longitude: device.location.longitude,
    connectionMode: device.connectionType,
    deviceStatus: device.status,
    speed: 0,
    sim: device.imei ?? "N/A",
    lockStatus: device.status === "UNLOCKED" ? "unsealed" : "sealed",
    shackleStatus: device.status === "UNLOCKED" ? "open" : "closed",
    alarmStatus: device.hasOpenAlert ? `${device.openAlertCount} active alarm(s)` : "Normal",
    events: device.hasOpenAlert ? ["Alarm active"] : ["Status synchronized"],
    positioningTime: device.location.recordedAt.toISOString(),
    location: `${device.location.latitude.toFixed(6)}, ${device.location.longitude.toFixed(6)}`,
    lastSeenAt: device.location.recordedAt.toISOString(),
  };
}

export function mapLegacyGeofence(geofence: {
  id: string;
  name: string;
  company: { id: string; name: string };
  centerLat: number;
  centerLng: number;
  radiusMt: number;
  isActive: boolean;
}): MonitoringGeoFence {
  return {
    id: geofence.id,
    name: geofence.name,
    companyId: geofence.company.id,
    companyName: geofence.company.name,
    type: "circle",
    centerLat: geofence.centerLat,
    centerLng: geofence.centerLng,
    radiusMt: geofence.radiusMt,
    isActive: geofence.isActive,
  };
}
