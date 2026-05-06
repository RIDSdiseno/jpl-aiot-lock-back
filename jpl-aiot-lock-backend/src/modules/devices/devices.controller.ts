import { Request, Response } from "express";
import {
  alarmPolicySchema,
  batchAssignCompanySchema,
  batchCreateSchema,
  batchModifySchema,
  deviceFiltersSchema,
  idListSchema,
  singleAlarmPolicySchema,
  updateDeviceSchema,
  createDeviceSchema,
} from "./devices.schemas";
import * as service from "./devices.service";

const actorId = (req: Request) => req.user?.id;

export async function list(req: Request, res: Response) {
  const filters = deviceFiltersSchema.parse(req.query);
  res.json({ ok: true, data: await service.listDevices(filters) });
}

export async function summary(req: Request, res: Response) {
  const filters = deviceFiltersSchema.parse(req.query);
  res.json({ ok: true, data: await service.getDeviceSummary(filters) });
}

export async function get(req: Request, res: Response) {
  res.json({ ok: true, data: await service.getDeviceById(req.params.id) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ ok: true, data: await service.createDevice(createDeviceSchema.parse(req.body), actorId(req)) });
}

export async function batchCreate(req: Request, res: Response) {
  const body = batchCreateSchema.parse(req.body);
  res.status(201).json({ ok: true, data: await service.batchCreateDevices(body.devices, actorId(req)) });
}

export async function update(req: Request, res: Response) {
  res.json({ ok: true, data: await service.updateDevice(req.params.id, updateDeviceSchema.parse(req.body), actorId(req)) });
}

export async function remove(req: Request, res: Response) {
  res.json(await service.deleteDevice(req.params.id, actorId(req)));
}

export async function batchDelete(req: Request, res: Response) {
  const body = idListSchema.parse(req.body);
  res.json(await service.batchDeleteDevices(body.deviceIds, actorId(req)));
}

export async function batchModify(req: Request, res: Response) {
  const body = batchModifySchema.parse(req.body);
  res.json(await service.batchModifyDevices(body.deviceIds, body.updates, actorId(req)));
}

export async function batchAssignCompany(req: Request, res: Response) {
  const body = batchAssignCompanySchema.parse(req.body);
  res.json(await service.batchAssignCompany(body.deviceIds, body.companyId, body.remarks, actorId(req)));
}

export async function batchAlarmPolicy(req: Request, res: Response) {
  const body = alarmPolicySchema.parse(req.body);
  res.json(await service.setBatchAlarmPolicy(body, actorId(req)));
}

export async function alarmStrategy(req: Request, res: Response) {
  const device = await service.getDeviceById(req.params.id);
  res.json({ ok: true, data: await service.listAlarmStrategy(device.deviceId) });
}

export async function setAlarmStrategy(req: Request, res: Response) {
  const body = singleAlarmPolicySchema.parse(req.body);
  const device = await service.getDeviceById(req.params.id);
  res.json(await service.setBatchAlarmPolicy({ ...body, deviceIds: [device.deviceId] }, actorId(req)));
}

export async function exportCsv(req: Request, res: Response) {
  const ids = Array.isArray(req.body?.deviceIds) ? idListSchema.parse(req.body).deviceIds : undefined;
  const csv = await service.exportDevices(deviceFiltersSchema.parse(req.body?.filters ?? {}), ids, actorId(req));
  res.header("Content-Type", "text/csv; charset=utf-8").attachment("devices.csv").send(csv);
}
