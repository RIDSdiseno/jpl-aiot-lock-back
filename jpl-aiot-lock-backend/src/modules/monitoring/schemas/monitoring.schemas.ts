import { z } from "zod";
import {
  MONITORING_DEVICE_TYPE_VALUES,
  MONITORING_STATUS_FILTER_VALUES,
} from "../constants/monitoring.constants";

export const monitoringDevicesQuerySchema = z.object({
  status: z.enum(MONITORING_STATUS_FILTER_VALUES).optional(),
  search: z.string().trim().min(1).optional(),
  companyId: z.string().uuid().optional(),
  type: z.enum(MONITORING_DEVICE_TYPE_VALUES).optional(),
});

export const monitoringGeofencesQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type MonitoringDevicesQueryInput = z.infer<typeof monitoringDevicesQuerySchema>;
export type MonitoringGeofencesQueryInput = z.infer<typeof monitoringGeofencesQuerySchema>;
