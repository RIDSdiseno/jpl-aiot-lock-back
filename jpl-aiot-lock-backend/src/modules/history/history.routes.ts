import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { prisma } from "../../config/prisma";
import { createAuditLog } from "../audit/audit.service";
import { AuditAction, Prisma } from "@prisma/client";

const router = Router();
router.use(authMiddleware);

function where(query: Record<string, unknown>): Prisma.DeviceHistoryDataWhereInput {
  const companyName = typeof query.companyName === "string" && query.companyName ? query.companyName : undefined;
  return {
    deviceId: typeof query.deviceId === "string" && query.deviceId ? { contains: query.deviceId, mode: "insensitive" } : undefined,
    deviceName: typeof query.deviceName === "string" && query.deviceName ? { contains: query.deviceName, mode: "insensitive" } : undefined,
    deviceType: typeof query.deviceType === "string" && query.deviceType ? query.deviceType : undefined,
    productModel: typeof query.productModel === "string" && query.productModel ? query.productModel : undefined,
    companyName: companyName ? { contains: companyName, mode: "insensitive" } : undefined,
    reportType: typeof query.reportType === "string" && query.reportType ? query.reportType : undefined,
    lockStatus: typeof query.lockStatus === "string" && query.lockStatus ? query.lockStatus : undefined,
    shackleStatus: typeof query.shackleStatus === "string" && query.shackleStatus ? query.shackleStatus : undefined,
    batteryLevel:
      typeof query.minBattery === "string" || typeof query.maxBattery === "string"
        ? {
            gte: typeof query.minBattery === "string" ? Number(query.minBattery) : undefined,
            lte: typeof query.maxBattery === "string" ? Number(query.maxBattery) : undefined,
          }
        : undefined,
    reportedAt:
      typeof query.from === "string" || typeof query.to === "string" || typeof query.startDate === "string" || typeof query.endDate === "string"
        ? {
            gte: typeof query.from === "string" ? new Date(query.from) : typeof query.startDate === "string" ? new Date(query.startDate) : undefined,
            lte: typeof query.to === "string" ? new Date(query.to) : typeof query.endDate === "string" ? new Date(query.endDate) : undefined,
          }
        : undefined,
  };
}

router.get("/device-data", async (req, res) => {
  const items = await prisma.deviceHistoryData.findMany({ where: where(req.query), orderBy: { reportedAt: "desc" }, take: 1000 });
  await createAuditLog({
    user: req.user?.id ? { connect: { id: req.user.id } } : undefined,
    action: AuditAction.SYSTEM_EVENT,
    entity: "DeviceHistoryData",
    description: "HISTORY_VIEWED",
    newValues: { count: items.length },
  }).catch(() => undefined);
  res.json({ ok: true, data: items });
});

router.get("/device-data/:id", async (req, res) => {
  const item = await prisma.deviceHistoryData.findUniqueOrThrow({ where: { id: req.params.id } });
  await createAuditLog({
    user: req.user?.id ? { connect: { id: req.user.id } } : undefined,
    action: AuditAction.SYSTEM_EVENT,
    entity: "DeviceHistoryData",
    entityId: item.id,
    description: "HISTORY_DETAIL_VIEWED",
  }).catch(() => undefined);
  res.json({ ok: true, data: item });
});

router.post("/device-data/export", async (req, res) => {
  const items = await prisma.deviceHistoryData.findMany({ where: where(req.body?.filters ?? {}), orderBy: { reportedAt: "desc" }, take: 1000 });
  await createAuditLog({
    user: req.user?.id ? { connect: { id: req.user.id } } : undefined,
    action: AuditAction.SYSTEM_EVENT,
    entity: "DeviceHistoryData",
    description: "HISTORY_EXPORTED",
    newValues: { count: items.length },
  }).catch(() => undefined);
  const header = ["Device ID", "Device name", "Device type", "Product model", "Company", "Report time", "Report type", "Longitude", "Latitude", "Address", "Lock status", "Shackle status", "Battery", "Signal", "Temperature", "Speed", "Firmware"];
  const rows = items.map((item) => [
    item.deviceId,
    item.deviceName ?? "",
    item.deviceType ?? "",
    item.productModel ?? "",
    item.companyName ?? "",
    item.reportedAt.toISOString(),
    item.reportType,
    item.longitude ?? "",
    item.latitude ?? "",
    item.address ?? "",
    item.lockStatus ?? "",
    item.shackleStatus ?? "",
    item.batteryLevel ?? "",
    item.signalStrength ?? "",
    item.temperature ?? "",
    item.speed ?? "",
    item.firmwareVersion ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.header("Content-Type", "text/csv; charset=utf-8").attachment("device-history.csv").send(csv);
});

router.post("/device-data/ingest", async (req, res) => {
  const body = req.body ?? {};
  const device = body.deviceId
    ? await prisma.device.findFirst({ where: { OR: [{ id: String(body.deviceId) }, { deviceId: String(body.deviceId) }], deletedAt: null } })
    : null;
  const company = device?.companyId ? await prisma.company.findUnique({ where: { id: device.companyId } }) : null;
  const item = await prisma.deviceHistoryData.create({
    data: {
      deviceId: String(body.deviceId ?? device?.deviceId ?? `MOCK-${Date.now()}`),
      deviceName: body.deviceName ?? device?.name,
      deviceType: body.deviceType ?? device?.deviceType,
      productModel: body.productModel ?? device?.productModel,
      companyId: body.companyId ?? device?.companyId,
      companyName: body.companyName ?? company?.name,
      reportType: body.reportType === "SUPPLEMENTARY" ? "SUPPLEMENTARY" : "REALTIME",
      reportedAt: body.reportedAt ? new Date(body.reportedAt) : new Date(),
      longitude: body.longitude == null ? device?.lastLocationLng : Number(body.longitude),
      latitude: body.latitude == null ? device?.lastLocationLat : Number(body.latitude),
      address: body.address ?? device?.lastAddress,
      lockStatus: body.lockStatus ?? device?.lockStatus ?? "UNKNOWN",
      shackleStatus: body.shackleStatus ?? device?.shackleStatus ?? "UNKNOWN",
      batteryLevel: body.batteryLevel == null ? device?.batteryLevel : Number(body.batteryLevel),
      signalStrength: body.signalStrength == null ? device?.signalStrength : Number(body.signalStrength),
      temperature: body.temperature == null ? undefined : Number(body.temperature),
      speed: body.speed == null ? undefined : Number(body.speed),
      firmwareVersion: body.firmwareVersion ?? device?.firmwareVersion,
      rawPayloadJson: body.rawPayloadJson ?? body,
      source: body.source ?? "MOCK",
    },
  });
  res.status(201).json({ ok: true, data: item });
});

export default router;
