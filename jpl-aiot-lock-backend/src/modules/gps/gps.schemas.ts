import { z } from "zod";

export const gpsLockParamsSchema = z.object({
  lockId: z.string().uuid(),
});

export const createLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  signalLevel: z.number().int().min(0).max(100).optional(),
  source: z.string().optional(),
  rawPayload: z.unknown().optional(),
  recordedAt: z.coerce.date().optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
