import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export function createAuditLog(data: Prisma.AuditLogCreateInput) {
  return prisma.auditLog.create({ data });
}
