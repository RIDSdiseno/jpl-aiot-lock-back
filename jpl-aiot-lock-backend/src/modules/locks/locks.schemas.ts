import { LockConnectionType, LockStatus } from "@prisma/client";
import { z } from "zod";

export const lockIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const lockRouteParamsSchema = z.object({
  lockId: z.string().uuid(),
});

export const createLockSchema = z.object({
  name: z.string().min(2),
  internalCode: z.string().min(1),
  serialNumber: z.string().optional(),
  imei: z.string().optional(),
  macAddress: z.string().optional(),
  status: z.nativeEnum(LockStatus).optional(),
  connectionType: z.nativeEnum(LockConnectionType).optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  signalLevel: z.number().int().min(0).max(100).optional(),
  firmwareVersion: z.string().optional(),
  hardwareVersion: z.string().optional(),
  lastConnectionAt: z.coerce.date().optional(),
  lastSyncAt: z.coerce.date().optional(),
  companyId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

export const updateLockSchema = createLockSchema.partial();

export type CreateLockInput = z.infer<typeof createLockSchema>;
export type UpdateLockInput = z.infer<typeof updateLockSchema>;
