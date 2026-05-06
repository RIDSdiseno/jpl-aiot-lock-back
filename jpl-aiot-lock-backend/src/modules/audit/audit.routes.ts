import { AuditAction, Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { createAuditLog } from "./audit.service";

const router = Router();
router.use(authMiddleware);

function where(query: Record<string, unknown>): Prisma.AuditLogWhereInput {
  return {
    user: typeof query.user === "string" && query.user ? { OR: [{ name: { contains: query.user, mode: "insensitive" } }, { email: { contains: query.user, mode: "insensitive" } }] } : undefined,
    entity: typeof query.module === "string" && query.module ? { contains: query.module, mode: "insensitive" } : undefined,
    description: typeof query.action === "string" && query.action ? { contains: query.action, mode: "insensitive" } : undefined,
    createdAt:
      typeof query.startDate === "string" || typeof query.endDate === "string"
        ? {
            gte: typeof query.startDate === "string" ? new Date(query.startDate) : undefined,
            lte: typeof query.endDate === "string" ? new Date(query.endDate) : undefined,
          }
        : undefined,
  };
}

router.get("/logs", async (req, res) => {
  const logs = await prisma.auditLog.findMany({ where: where(req.query), include: { user: { include: { company: true } } }, orderBy: { createdAt: "desc" }, take: 1000 });
  res.json({
    ok: true,
    data: logs.map((log) => ({
      ...log,
      username: log.user?.name ?? log.user?.email ?? null,
      companyId: log.user?.companyId ?? null,
      companyName: log.user?.company?.name ?? null,
      module: log.entity,
      beforeJson: log.oldValues,
      afterJson: log.newValues,
    })),
  });
});

router.get("/logs/:id", async (req, res) => {
  const log = await prisma.auditLog.findUniqueOrThrow({ where: { id: req.params.id }, include: { user: { include: { company: true } } } });
  res.json({ ok: true, data: log });
});

router.post("/logs/export", async (req, res) => {
  const logs = await prisma.auditLog.findMany({ where: where(req.body?.filters ?? {}), include: { user: { include: { company: true } } }, orderBy: { createdAt: "desc" }, take: 1000 });
  await createAuditLog({
    user: req.user?.id ? { connect: { id: req.user.id } } : undefined,
    action: AuditAction.SYSTEM_EVENT,
    entity: "AUDIT",
    description: "AUDIT_EXPORTED",
    newValues: { count: logs.length },
  }).catch(() => undefined);
  const header = ["User", "Company", "Action", "Module", "Description", "IP address", "User agent", "Created time"];
  const rows = logs.map((log) => [log.user?.name ?? log.user?.email ?? "", log.user?.company?.name ?? "", log.action, log.entity, log.description ?? "", log.ipAddress ?? "", log.userAgent ?? "", log.createdAt.toISOString()]);
  const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.header("Content-Type", "text/csv; charset=utf-8").attachment("audit-logs.csv").send(csv);
});

export default router;
