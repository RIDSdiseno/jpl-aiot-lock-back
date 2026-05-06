import { Router } from "express";
import { AuditAction, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { createAuditLog } from "../audit/audit.service";

const router = Router();
router.use(authMiddleware);

const firmwareSchema = z.object({
  deviceType: z.string().min(1),
  productModel: z.string().min(1),
  firmwareType: z.enum(["MASTER_MCU", "BLUETOOTH_MCU", "EXTENSION_MCU"]),
  versionName: z.string().min(1),
  fileName: z.string().min(1),
  filePath: z.string().optional(),
  fileSize: z.number().int().positive().max(100 * 1024 * 1024),
  mimeType: z.string().optional(),
  description: z.string().optional().nullable(),
});

function audit(userId: string | undefined, description: string, entity: string, entityId?: string, values?: Prisma.InputJsonValue) {
  return createAuditLog({
    user: userId ? { connect: { id: userId } } : undefined,
    action: AuditAction.SYSTEM_EVENT,
    entity,
    entityId,
    description,
    newValues: values,
  }).catch(() => undefined);
}

router.get("/firmware", async (req, res) => {
  const items = await prisma.firmwareFile.findMany({
    where: {
      deletedAt: null,
      deviceType: typeof req.query.deviceType === "string" && req.query.deviceType ? req.query.deviceType : undefined,
      productModel: typeof req.query.productModel === "string" && req.query.productModel ? req.query.productModel : undefined,
    },
    orderBy: { uploadedAt: "desc" },
  });
  res.json({ ok: true, data: items });
});

router.get("/firmware/:id", async (req, res) => {
  const item = await prisma.firmwareFile.findFirstOrThrow({ where: { id: req.params.id, deletedAt: null } });
  await audit(req.user?.id, "FIRMWARE_DETAIL_VIEWED", "FirmwareFile", item.id);
  res.json({ ok: true, data: item });
});

router.post("/firmware/upload", async (req, res) => {
  const body = firmwareSchema.parse(req.body);
  const lowerName = body.fileName.toLowerCase();
  if (body.firmwareType === "MASTER_MCU" && !lowerName.endsWith(".bin")) {
    return res.status(400).json({ ok: false, message: "Master MCU firmware must be .bin" });
  }
  if (body.firmwareType !== "MASTER_MCU" && !lowerName.endsWith(".zip")) {
    return res.status(400).json({ ok: false, message: "Bluetooth/Extension MCU firmware must be .zip" });
  }
  const item = await prisma.firmwareFile.create({
    data: { ...body, filePath: body.filePath ?? `/firmware/${body.fileName}`, originalFileName: body.fileName, uploadedById: req.user?.id, uploadedByName: req.user?.role ?? req.user?.id },
  });
  await audit(req.user?.id, "FIRMWARE_UPLOADED", "FirmwareFile", item.id, { versionName: item.versionName });
  res.status(201).json({ ok: true, data: item });
});

router.get("/firmware/:id/download", async (req, res) => {
  const item = await prisma.firmwareFile.findFirstOrThrow({ where: { id: req.params.id, deletedAt: null } });
  await audit(req.user?.id, "FIRMWARE_DOWNLOADED", "FirmwareFile", item.id);
  res.json({ ok: true, data: item });
});

router.delete("/firmware/:id", async (req, res) => {
  const activeOta = await prisma.otaUpgradeRecord.count({
    where: { firmwareFileId: req.params.id, status: { in: ["PENDING", "SENDING", "UPDATING", "WAITING_REBOOT", "VERIFYING"] } },
  });
  if (activeOta > 0) return res.status(409).json({ ok: false, message: "Firmware is used by active OTA records" });
  const item = await prisma.firmwareFile.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  await audit(req.user?.id, "FIRMWARE_DELETED", "FirmwareFile", item.id);
  res.json({ ok: true });
});

router.get("/ota/devices", async (req, res) => {
  const devices = await prisma.device.findMany({
    where: {
      deletedAt: null,
      deviceType: typeof req.query.deviceType === "string" && req.query.deviceType ? req.query.deviceType : undefined,
      productModel: typeof req.query.productModel === "string" && req.query.productModel ? req.query.productModel : undefined,
      deviceId: typeof req.query.deviceId === "string" && req.query.deviceId ? { contains: req.query.deviceId, mode: "insensitive" } : undefined,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ ok: true, data: devices });
});

router.post("/ota/upgrade", async (req, res) => {
  const body = z.object({ deviceId: z.string().min(1), firmwareFileId: z.string().min(1) }).parse(req.body);
  const [device, firmware] = await Promise.all([
    prisma.device.findFirstOrThrow({ where: { OR: [{ id: body.deviceId }, { deviceId: body.deviceId }], deletedAt: null } }),
    prisma.firmwareFile.findFirstOrThrow({ where: { id: body.firmwareFileId, deletedAt: null } }),
  ]);
  if (device.deviceType !== firmware.deviceType || device.productModel !== firmware.productModel) {
    return res.status(400).json({ ok: false, message: "Firmware is not compatible with the selected device" });
  }
  const active = await prisma.otaUpgradeRecord.findFirst({
    where: { deviceId: device.deviceId, status: { in: ["PENDING", "SENDING", "UPDATING", "WAITING_REBOOT", "VERIFYING"] } },
  });
  if (active) return res.status(409).json({ ok: false, message: "Device already has an active OTA upgrade" });
  const record = await prisma.otaUpgradeRecord.create({
    data: {
      deviceId: device.deviceId,
      deviceName: device.name,
      productModel: device.productModel,
      companyId: device.companyId,
      firmwareFileId: firmware.id,
      firmwareType: firmware.firmwareType,
      fromVersion: device.firmwareVersion,
      toVersion: firmware.versionName,
      targetVersion: firmware.versionName,
      status: device.onlineStatus === "ONLINE" ? "SENDING" : "PENDING",
      progress: device.onlineStatus === "ONLINE" ? 10 : 0,
      startedAt: new Date(),
      createdById: req.user?.id,
      createdByName: req.user?.role ?? req.user?.id,
      commandPayloadJson: { deviceId: device.deviceId, firmwareFileId: firmware.id },
    },
  });
  await prisma.device.update({ where: { id: device.id }, data: { onlineStatus: "UPDATING" } });
  await audit(req.user?.id, "OTA_UPGRADE_REQUESTED", "OtaUpgradeRecord", record.id, { deviceId: device.deviceId });
  res.status(201).json({ ok: true, data: record });
});

router.post("/ota/batch-upgrade", async (req, res) => {
  const body = z.object({ deviceIds: z.array(z.string()).min(1), firmwareFileId: z.string().min(1) }).parse(req.body);
  const results = [];
  for (const deviceId of body.deviceIds) {
    const device = await prisma.device.findFirst({ where: { OR: [{ id: deviceId }, { deviceId }], deletedAt: null } });
    const firmware = await prisma.firmwareFile.findFirst({ where: { id: body.firmwareFileId, deletedAt: null } });
    if (!device || !firmware || device.deviceType !== firmware.deviceType || device.productModel !== firmware.productModel) continue;
    const active = await prisma.otaUpgradeRecord.count({ where: { deviceId: device.deviceId, status: { in: ["PENDING", "SENDING", "UPDATING", "WAITING_REBOOT", "VERIFYING"] } } });
    if (active) continue;
    results.push(await prisma.otaUpgradeRecord.create({
      data: {
        deviceId: device.deviceId,
        deviceName: device.name,
        productModel: device.productModel,
        companyId: device.companyId,
        firmwareFileId: firmware.id,
        firmwareType: firmware.firmwareType,
        fromVersion: device.firmwareVersion,
        toVersion: firmware.versionName,
        targetVersion: firmware.versionName,
        status: device.onlineStatus === "ONLINE" ? "SENDING" : "PENDING",
        progress: device.onlineStatus === "ONLINE" ? 10 : 0,
        startedAt: new Date(),
        createdById: req.user?.id,
        createdByName: req.user?.role ?? req.user?.id,
        commandPayloadJson: { deviceId: device.deviceId, firmwareFileId: firmware.id, batch: true },
      },
    }));
  }
  await audit(req.user?.id, "OTA_BATCH_UPGRADE_REQUESTED", "OtaUpgradeRecord", undefined, { count: results.length });
  res.status(201).json({ ok: true, data: results });
});

router.get("/ota/records", async (_req, res) => {
  const records = await prisma.otaUpgradeRecord.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  res.json({ ok: true, data: records });
});

router.get("/ota/records/:id", async (req, res) => {
  res.json({ ok: true, data: await prisma.otaUpgradeRecord.findUniqueOrThrow({ where: { id: req.params.id } }) });
});

router.post("/ota/records/:id/retry", async (req, res) => {
  const record = await prisma.otaUpgradeRecord.update({ where: { id: req.params.id }, data: { status: "SENDING", progress: 10, errorMessage: null, startedAt: new Date(), finishedAt: null } });
  await audit(req.user?.id, "OTA_UPGRADE_REQUESTED", "OtaUpgradeRecord", record.id);
  res.json({ ok: true, data: record });
});

router.post("/ota/records/:id/cancel", async (req, res) => {
  const record = await prisma.otaUpgradeRecord.update({ where: { id: req.params.id }, data: { status: "CANCELLED", finishedAt: new Date() } });
  await audit(req.user?.id, "OTA_UPGRADE_CANCELLED", "OtaUpgradeRecord", record.id);
  res.json({ ok: true, data: record });
});

router.post("/ota/records/:id/verify", async (req, res) => {
  const current = await prisma.otaUpgradeRecord.findUniqueOrThrow({ where: { id: req.params.id } });
  const device = await prisma.device.findFirst({ where: { deviceId: current.deviceId, deletedAt: null } });
  const success = device?.firmwareVersion === (current.targetVersion ?? current.toVersion);
  const record = await prisma.otaUpgradeRecord.update({
    where: { id: req.params.id },
    data: {
      status: success ? "SUCCESS" : "FAILED",
      progress: success ? 100 : current.progress,
      verifiedAt: new Date(),
      finishedAt: new Date(),
      errorMessage: success ? null : "Firmware version does not match target version",
    },
  });
  await audit(req.user?.id, success ? "OTA_UPGRADE_SUCCESS" : "OTA_UPGRADE_FAILED", "OtaUpgradeRecord", record.id);
  res.json({ ok: true, data: record });
});

function diagnosisWhere(query: Record<string, unknown>): Prisma.DeviceDiagnosisLogWhereInput {
  return {
    deviceId: typeof query.deviceId === "string" && query.deviceId ? { contains: query.deviceId, mode: "insensitive" } : undefined,
    deviceName: typeof query.deviceName === "string" && query.deviceName ? { contains: query.deviceName, mode: "insensitive" } : undefined,
    productModel: typeof query.productModel === "string" && query.productModel ? query.productModel : undefined,
    companyId: typeof query.companyId === "string" && query.companyId ? query.companyId : undefined,
    diagnosisType: typeof query.diagnosisType === "string" && query.diagnosisType ? query.diagnosisType : undefined,
    logLevel: typeof query.logLevel === "string" && query.logLevel ? query.logLevel : undefined,
    source: typeof query.source === "string" && query.source ? query.source : undefined,
    uploadedByName: typeof query.uploadedBy === "string" && query.uploadedBy ? { contains: query.uploadedBy, mode: "insensitive" } : undefined,
    uploadedAt:
      typeof query.startDate === "string" || typeof query.endDate === "string"
        ? {
            gte: typeof query.startDate === "string" ? new Date(query.startDate) : undefined,
            lte: typeof query.endDate === "string" ? new Date(query.endDate) : undefined,
          }
        : undefined,
  };
}

const diagnosisSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().optional(),
  productModel: z.string().optional(),
  companyId: z.string().optional().nullable(),
  diagnosisType: z.enum(["NETWORK", "BLUETOOTH", "HARDWARE", "FIRMWARE", "GPS", "NFC", "BATTERY", "COMMUNICATION", "UNKNOWN"]).default("UNKNOWN"),
  logLevel: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).default("INFO"),
  summary: z.string().min(1),
  fullLog: z.string().min(1),
  rawPayloadJson: z.unknown().optional(),
  source: z.enum(["WEB", "APP_BLUETOOTH", "DEVICE_AUTO_UPLOAD", "MOCK"]).default("MOCK"),
  attachmentUrl: z.string().optional().nullable(),
});

router.get("/diagnosis", async (req, res) => {
  const items = await prisma.deviceDiagnosisLog.findMany({ where: diagnosisWhere(req.query), orderBy: { uploadedAt: "desc" }, take: 1000 });
  await audit(req.user?.id, "DIAGNOSIS_VIEWED", "DeviceDiagnosisLog", undefined, { count: items.length });
  res.json({ ok: true, data: items });
});

router.get("/diagnosis/:id", async (req, res) => {
  const item = await prisma.deviceDiagnosisLog.findUniqueOrThrow({ where: { id: req.params.id } });
  await audit(req.user?.id, "DIAGNOSIS_DETAIL_VIEWED", "DeviceDiagnosisLog", item.id);
  res.json({ ok: true, data: item });
});

router.post("/diagnosis/upload", async (req, res) => {
  const body = diagnosisSchema.parse(req.body);
  const device = await prisma.device.findFirst({ where: { OR: [{ id: body.deviceId }, { deviceId: body.deviceId }], deletedAt: null } });
  const item = await prisma.deviceDiagnosisLog.create({
    data: {
      ...body,
      deviceId: device?.deviceId ?? body.deviceId,
      deviceName: body.deviceName ?? device?.name,
      productModel: body.productModel ?? device?.productModel,
      companyId: body.companyId ?? device?.companyId,
      rawPayloadJson: body.rawPayloadJson as Prisma.InputJsonValue,
      uploadedById: req.user?.id,
      uploadedByName: req.user?.role ?? req.user?.id,
    },
  });
  await audit(req.user?.id, "DIAGNOSIS_UPLOADED", "DeviceDiagnosisLog", item.id);
  res.status(201).json({ ok: true, data: item });
});

router.post("/diagnosis/export", async (req, res) => {
  const items = await prisma.deviceDiagnosisLog.findMany({ where: diagnosisWhere(req.body?.filters ?? {}), orderBy: { uploadedAt: "desc" }, take: 1000 });
  await audit(req.user?.id, "DIAGNOSIS_EXPORTED", "DeviceDiagnosisLog", undefined, { count: items.length });
  const header = ["Device ID", "Device name", "Product model", "Diagnosis type", "Log level", "Summary", "Source", "Uploaded at", "Uploaded by"];
  const rows = items.map((item) => [item.deviceId, item.deviceName ?? "", item.productModel ?? "", item.diagnosisType, item.logLevel, item.summary, item.source, item.uploadedAt.toISOString(), item.uploadedByName ?? ""]);
  const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.header("Content-Type", "text/csv; charset=utf-8").attachment("diagnosis.csv").send(csv);
});

router.get("/diagnosis/:id/download", async (req, res) => {
  const item = await prisma.deviceDiagnosisLog.findUniqueOrThrow({ where: { id: req.params.id } });
  await audit(req.user?.id, "DIAGNOSIS_DOWNLOADED", "DeviceDiagnosisLog", item.id);
  res.header("Content-Type", "text/plain; charset=utf-8").attachment(`${item.deviceId}-diagnosis.log`).send(item.fullLog);
});

export default router;
