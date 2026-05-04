import { AlertStatus, AuditAction } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createAuditLog } from "../audit/audit.service";
import { UpdateAlertInput } from "./alerts.schemas";

export function listAlerts() {
  return prisma.alert.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export function getAlertById(id: string) {
  return prisma.alert.findUniqueOrThrow({ where: { id } });
}

export async function updateAlert(id: string, data: UpdateAlertInput, actorId?: string) {
  const now = new Date();
  const alert = await prisma.alert.update({
    where: { id },
    data: {
      ...data,
      acknowledgedAt: data.status === AlertStatus.ACKNOWLEDGED ? now : undefined,
      resolvedAt: data.status === AlertStatus.RESOLVED ? now : undefined,
    },
  });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.UPDATE,
    entity: "Alert",
    entityId: id,
    description: "Alert updated",
  });

  return alert;
}
