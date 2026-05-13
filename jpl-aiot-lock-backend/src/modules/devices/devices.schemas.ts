import { z } from "zod";

const optionalTrimmed = z.string().trim().optional().nullable();
const statusSchema = z.enum(["ONLINE", "OFFLINE", "SLEEP", "DORMANT", "UNKNOWN", "DELETED"]);
const sortBySchema = z.enum(["deviceName", "deviceId", "status", "createdAt"]).optional();
const sortOrderSchema = z.enum(["asc", "desc", "ASC", "DESC"]).optional();

export const deviceFiltersSchema = z.object({
  deviceType: z.string().optional(),
  productModel: z.string().optional(),
  deviceId: z.string().optional(),
  companyId: z.string().optional(),
  affiliatedCompany: z.string().optional(),
  affiliatedCompanyId: z.string().optional(),
  deviceName: z.string().optional(),
  search: z.string().optional(),
  status: statusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: sortBySchema,
  sortOrder: sortOrderSchema.default("desc"),
});

export const createDeviceSchema = z.object({
  deviceId: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9._:-]+$/, "INVALID_DEVICE_ID"),
  name: z.string().trim().min(1).max(100).optional(),
  deviceName: z.string().trim().max(100).optional(),
  deviceType: z.string().trim().min(1),
  productModel: z.string().trim().min(1),
  companyId: z.string().trim().min(1).optional(),
  affiliatedCompanyId: z.string().trim().min(1).optional(),
  imei: optionalTrimmed,
  serialNumber: optionalTrimmed,
  simNumber: optionalTrimmed,
  phoneNumber: optionalTrimmed,
  iccid: optionalTrimmed,
  simIccid: optionalTrimmed,
  firmwareVersion: optionalTrimmed,
  hardwareVersion: optionalTrimmed,
  bluetoothName: optionalTrimmed,
  notes: optionalTrimmed,
  description: optionalTrimmed,
});

export const updateDeviceSchema = createDeviceSchema.partial().extend({
  onlineStatus: statusSchema.optional(),
  status: z.string().optional(),
});

export const batchCreateSchema = z.object({
  devices: z.array(createDeviceSchema).min(1),
});

export const idListSchema = z.object({
  deviceIds: z.array(z.string().min(1)).min(1),
});

export const batchModifySchema = idListSchema.extend({
  updates: updateDeviceSchema.omit({ deviceId: true }).partial(),
});

export const batchAssignCompanySchema = idListSchema.extend({
  companyId: z.string().trim().min(1),
  remarks: optionalTrimmed,
});

export const alarmPolicySchema = idListSchema.extend({
  receivePhones: optionalTrimmed,
  receiveEmails: optionalTrimmed,
  pushTypes: z.array(z.enum(["SMS", "EMAIL"])).min(1),
  sendingEventTypes: z.array(z.string().trim().min(1)).min(1),
  enabled: z.boolean(),
  remarks: optionalTrimmed,
});

export const singleAlarmPolicySchema = alarmPolicySchema.omit({ deviceIds: true }).extend({
  deviceIds: z.array(z.string()).optional(),
});

export type DeviceFiltersInput = z.infer<typeof deviceFiltersSchema>;
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
