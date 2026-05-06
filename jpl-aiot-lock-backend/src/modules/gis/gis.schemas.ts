import { z } from "zod";

const eightDigits = z.string().regex(/^\d{8}$/);
const elevenDigits = z.string().regex(/^\d{11}$/);

export const fenceRuleSchema = z
  .object({
    ruleType: z.enum([
      "TOUCHING_SEAL",
      "PASSWORD_SEAL_UNSEAL",
      "CARD_SEAL_UNSEAL",
      "TIMING_UNSEAL",
      "SMS_SEAL_UNSEAL",
      "BLE_SEAL_UNSEAL",
      "REMOTE_SEAL_UNSEAL",
    ]),
    enabled: z.boolean(),
    value: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    expiresAt: z.string().optional(),
    description: z.string().optional(),
  })
  .superRefine((rule, ctx) => {
    if (!rule.enabled) return;
    if (["TOUCHING_SEAL", "PASSWORD_SEAL_UNSEAL", "CARD_SEAL_UNSEAL", "BLE_SEAL_UNSEAL", "REMOTE_SEAL_UNSEAL"].includes(rule.ruleType)) {
      const parsed = eightDigits.safeParse(rule.value ?? "");
      if (!parsed.success) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Value must contain exactly 8 digits" });
    }
    if (rule.ruleType === "SMS_SEAL_UNSEAL" && !elevenDigits.safeParse(rule.value ?? "").success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "SIM number must contain exactly 11 digits" });
    }
    if (rule.ruleType === "TIMING_UNSEAL" && rule.startTime && rule.endTime && rule.startTime > rule.endTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endTime"], message: "End time must be after start time" });
    }
  });

export const geoFenceGeometrySchema = z.object({
  center: z.object({ lat: z.number(), lng: z.number() }).optional(),
  radiusMeters: z.number().positive().optional(),
  points: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
});

const geoFencePayloadSchema = z.object({
    name: z.string().trim().min(1),
    type: z.enum(["POLYGON", "CIRCLE"]),
    status: z.enum(["DRAFT", "ACTIVE", "SENT", "FAILED", "INACTIVE"]).optional(),
    geometry: geoFenceGeometrySchema,
    rules: z.array(fenceRuleSchema).default([]),
  });

export const createGeoFenceSchema = geoFencePayloadSchema
  .superRefine((data, ctx) => {
    if (data.type === "CIRCLE" && (!data.geometry.center || !data.geometry.radiusMeters)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["geometry"], message: "Circle requires center and radius" });
    }
    if (data.type === "POLYGON" && (!data.geometry.points || data.geometry.points.length < 3)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["geometry"], message: "Polygon requires at least 3 points" });
    }
  });

export const updateGeoFenceSchema = geoFencePayloadSchema.partial();
export const idParamsSchema = z.object({ id: z.string().min(1) });
export const deviceReadParamsSchema = z.object({ deviceId: z.string().min(1) });
export const batchDeleteSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });
export const sendFenceSchema = z.object({
  geoFenceIds: z.array(z.string().min(1)).min(1),
  devices: z.array(z.object({ deviceId: z.string().min(1), deviceName: z.string().optional(), status: z.string().optional() })).min(1),
});
export const readDeviceFenceSchema = z.object({
  queryType: z.enum(["CIRCLE_FENCE_LIST", "POLYGON_FENCE_LIST", "FENCE_RULE_LIST"]),
  blockNumber: z.number().int().positive().default(1),
});
