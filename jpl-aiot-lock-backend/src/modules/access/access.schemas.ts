import { AccessStatus, AccessType } from "@prisma/client";
import { z } from "zod";

export const lockAccessParamsSchema = z.object({
  lockId: z.string().uuid(),
});

export const userLocksParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const revokeAccessParamsSchema = z.object({
  lockId: z.string().uuid(),
  accessId: z.string().uuid(),
});

export const createAccessSchema = z.object({
  userId: z.string().uuid(),
  accessType: z.nativeEnum(AccessType).optional(),
  status: z.nativeEnum(AccessStatus).optional(),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional(),
  allowedDays: z.string().optional(),
  allowedFromTime: z.string().optional(),
  allowedToTime: z.string().optional(),
  reason: z.string().optional(),
});

export type CreateAccessInput = z.infer<typeof createAccessSchema>;
