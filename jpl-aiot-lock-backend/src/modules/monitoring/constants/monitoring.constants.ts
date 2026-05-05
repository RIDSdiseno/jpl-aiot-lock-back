import { AlertSeverity, AlertStatus } from "@prisma/client";

export const MONITORING_STATUS_FILTER_VALUES = [
  "ALL",
  "ONLINE",
  "OFFLINE",
  "SLEEP",
  "LOST_SIGNAL",
  "UNKNOWN",
  "ALARM",
] as const;

export const MONITORING_DEVICE_TYPE_VALUES = [
  "SMART_LOCK",
  "SMART_SENSOR",
  "GPS_TRACKER",
  "E_SEAL",
  "SMART_GATEWAY",
  "SMART_BOX",
] as const;

export const OPEN_MONITORING_ALERT_STATUSES = [
  AlertStatus.OPEN,
  AlertStatus.ACKNOWLEDGED,
] as const;

export const MONITORING_ALARM_SEVERITIES = [
  AlertSeverity.WARNING,
  AlertSeverity.CRITICAL,
] as const;
