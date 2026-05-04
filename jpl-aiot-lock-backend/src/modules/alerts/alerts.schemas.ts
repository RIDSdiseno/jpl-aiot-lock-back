import { AlertSeverity, AlertStatus } from "@prisma/client";
import { z } from "zod";

export const alertIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateAlertSchema = z.object({
  title: z.string().min(2).optional(),
  message: z.string().min(2).optional(),
  severity: z.nativeEnum(AlertSeverity).optional(),
  status: z.nativeEnum(AlertStatus).optional(),
});

export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
