import { z } from "zod";

const optionalTrimmed = z.string().trim().optional().nullable();

export const deviceFiltersSchema = z.object({
  deviceType: z.string().optional(),
  productModel: z.string().optional(),
  deviceId: z.string().optional(),
  companyId: z.string().optional(),
  affiliatedCompany: z.string().optional(),
  deviceName: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const createDeviceSchema = z.object({
  deviceId: z.string().trim().min(1),
  name: z.string().trim().min(1).optional(),
  deviceName: z.string().trim().min(1).optional(),
  deviceType: z.string().trim().min(1),
  productModel: z.string().trim().min(1),
  companyId: z.string().trim().min(1).optional(),
  affiliatedCompanyId: z.string().trim().min(1).optional(),
  imei: optionalTrimmed,
  serialNumber: optionalTrimmed,
  simNumber: optionalTrimmed,
  iccid: optionalTrimmed,
  firmwareVersion: optionalTrimmed,
  hardwareVersion: optionalTrimmed,
  bluetoothName: optionalTrimmed,
  notes: optionalTrimmed,
});

export const updateDeviceSchema = createDeviceSchema.partial().extend({
  onlineStatus: z.string().optional(),
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
