import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { MonitoringCurrentUser } from "./monitoring.types";

export async function auditMonitoringAction(
  currentUser: MonitoringCurrentUser,
  action: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  const userId = currentUser.id ?? currentUser.userId;

  if (!userId) return;

  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.SYSTEM_EVENT,
        entity: "Monitoring",
        entityId,
        description: action,
        newValues: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // Monitoring must keep working with mock data even before database migrations are applied.
  }
}
