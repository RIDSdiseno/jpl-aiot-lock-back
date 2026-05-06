import { createAuditLog } from "../audit/audit.service";
import * as repository from "./gis.repository";
import type { DeviceFenceQueryType, GeoFenceInput, SendFenceInput } from "./gis.types";

function audit(action: string, userId: string | undefined, entityId?: string, payload?: object) {
  return createAuditLog({
    action: "SYSTEM_EVENT",
    entity: "GIS",
    entityId,
    user: userId ? { connect: { id: userId } } : undefined,
    description: action,
    newValues: payload,
  }).catch(() => undefined);
}

export async function listGeoFences(search?: string) {
  return repository.listGeoFences(search);
}

export async function getGeoFence(id: string) {
  const fence = await repository.getGeoFence(id);
  if (!fence) {
    const error = new Error("Geo-fence not found");
    Object.assign(error, { statusCode: 404 });
    throw error;
  }
  return fence;
}

export async function createGeoFence(data: GeoFenceInput, userId?: string) {
  const fence = await repository.createGeoFence(data, userId);
  await audit("GEO_FENCE_CREATED", userId, (fence as { id?: string }).id, { name: data.name, type: data.type });
  return fence;
}

export async function updateGeoFence(id: string, data: Partial<GeoFenceInput>, userId?: string) {
  const fence = await repository.updateGeoFence(id, data, userId);
  if (!fence) {
    const error = new Error("Geo-fence not found");
    Object.assign(error, { statusCode: 404 });
    throw error;
  }
  await audit("GEO_FENCE_UPDATED", userId, id, data);
  return fence;
}

export async function deleteGeoFence(id: string, userId?: string) {
  await getGeoFence(id);
  await repository.softDeleteGeoFence(id);
  await audit("GEO_FENCE_DELETED", userId, id);
  return { deleted: true };
}

export async function batchDeleteGeoFences(ids: string[], userId?: string) {
  await repository.batchDeleteGeoFences(ids);
  await audit("GEO_FENCE_BATCH_DELETED", userId, undefined, { ids });
  return { deleted: ids.length };
}

export async function sendGeoFences(input: SendFenceInput, userId?: string) {
  const records = await repository.createSendRecords(input);
  await audit("GEO_FENCE_SENT", userId, undefined, { fenceCount: input.geoFenceIds.length, deviceCount: input.devices.length });
  return records;
}

export async function listFenceRecords(filters: { deviceId?: string; deviceName?: string; status?: string; startDate?: string; endDate?: string }) {
  return repository.listSendRecords(filters);
}

export async function resendFenceRecord(id: string, userId?: string) {
  const record = await repository.updateSendRecordStatus(id, "SENT");
  await audit("GEO_FENCE_SENT", userId, id, { resend: true });
  return record;
}

export async function stopFenceRecord(id: string, userId?: string) {
  const record = await repository.updateSendRecordStatus(id, "STOPPED");
  await audit("GEO_FENCE_SEND_STOPPED", userId, id);
  return record;
}

export async function deleteFenceRecord(id: string) {
  await repository.deleteSendRecord(id);
  return { deleted: true };
}

export async function batchDeleteFenceRecords(ids: string[]) {
  await repository.batchDeleteSendRecords(ids);
  return { deleted: ids.length };
}

export async function stopSending(ids: string[], userId?: string) {
  const records = [];
  for (const id of ids) records.push(await stopFenceRecord(id, userId));
  return records;
}

export async function readDeviceFences(deviceId: string, queryType: DeviceFenceQueryType, blockNumber: number, userId?: string) {
  await audit("DEVICE_FENCE_READ_REQUESTED", userId, undefined, { deviceId, queryType, blockNumber });
  const record = await repository.readDeviceFences(deviceId, queryType, blockNumber);
  await audit("DEVICE_FENCE_READ_COMPLETED", userId, undefined, { deviceId, queryType, blockNumber });
  return record;
}
