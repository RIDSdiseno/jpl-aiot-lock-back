import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  alarmPolicySchema,
  batchAssignCompanySchema,
  batchCreateSchema,
  batchModifySchema,
  createDeviceSchema,
  deviceFiltersSchema,
  idListSchema,
  singleAlarmPolicySchema,
  updateDeviceSchema,
} from "./devices.schemas";
import * as service from "./devices.service";

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const actorId = (req: Request) => req.user?.id;

function handle(fn: AsyncController) {
  return (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch((error) => {
      if (error instanceof ZodError) {
        console.log("[DEVICE][VALIDATION_ERROR]", error.errors[0]?.message);
        res.status(400).json({
          ok: false,
          code: error.errors[0]?.message || "VALIDATION_ERROR",
          message: error.errors[0]?.message || "Validation error",
        });
        return;
      }
      next(error);
    });
}

export const list = handle(async (req, res) => {
  const filters = deviceFiltersSchema.parse(req.query);
  const result = await service.listDevices(filters);
  res.json({ ok: true, data: result.data, pagination: result.pagination });
});

export const summary = handle(async (req, res) => {
  const filters = deviceFiltersSchema.parse(req.query);
  res.json({ ok: true, data: await service.getDeviceSummary(filters) });
});

export const options = handle(async (_req, res) => {
  res.json({ ok: true, data: await service.getDeviceOptions() });
});

export const get = handle(async (req, res) => {
  res.json({ ok: true, data: await service.getDeviceById(req.params.id) });
});

export const slaves = handle(async (req, res) => {
  res.json({ ok: true, data: await service.getSlaveDevices(req.params.id) });
});

export const create = handle(async (req, res) => {
  const data = await service.createDevice(createDeviceSchema.parse(req.body), actorId(req));
  res.status(201).json({ ok: true, message: "Device created successfully", data });
});

export const batchCreate = handle(async (req, res) => {
  const body = batchCreateSchema.parse(req.body);
  res.status(201).json({ ok: true, message: "Batch import completed", data: await service.batchCreateDevices(body.devices, actorId(req)) });
});

export const update = handle(async (req, res) => {
  res.json({ ok: true, data: await service.updateDevice(req.params.id, updateDeviceSchema.parse(req.body), actorId(req)) });
});

export const remove = handle(async (req, res) => {
  res.json({ ok: true, message: "Device deleted successfully", data: await service.deleteDevice(req.params.id, actorId(req)) });
});

export const batchDelete = handle(async (req, res) => {
  const body = idListSchema.parse(req.body);
  res.json({ ok: true, message: "Devices deleted successfully", data: await service.batchDeleteDevices(body.deviceIds, actorId(req)) });
});

export const batchModify = handle(async (req, res) => {
  const body = batchModifySchema.parse(req.body);
  res.json({ ok: true, data: await service.batchModifyDevices(body.deviceIds, body.updates, actorId(req)) });
});

export const batchAssignCompany = handle(async (req, res) => {
  const body = batchAssignCompanySchema.parse(req.body);
  res.json({ ok: true, data: await service.batchAssignCompany(body.deviceIds, body.companyId, body.remarks, actorId(req)) });
});

export const batchAlarmPolicy = handle(async (req, res) => {
  const body = alarmPolicySchema.parse(req.body);
  res.json(await service.setBatchAlarmPolicy(body, actorId(req)));
});

export const alarmStrategy = handle(async (req, res) => {
  const device = await service.getDeviceById(req.params.id);
  res.json({ ok: true, data: await service.listAlarmStrategy(device.deviceId) });
});

export const setAlarmStrategy = handle(async (req, res) => {
  const body = singleAlarmPolicySchema.parse(req.body);
  const device = await service.getDeviceById(req.params.id);
  res.json(await service.setBatchAlarmPolicy({ ...body, deviceIds: [device.deviceId] }, actorId(req)));
});

export const exportCsv = handle(async (req, res) => {
  const filters = deviceFiltersSchema.parse(req.method === "GET" ? req.query : req.body?.filters ?? {});
  const ids = Array.isArray(req.body?.deviceIds) ? idListSchema.parse(req.body).deviceIds : undefined;
  const csv = await service.exportDevices(filters, ids, actorId(req));
  res.header("Content-Type", "text/csv; charset=utf-8").attachment("devices.csv").send(csv);
});
