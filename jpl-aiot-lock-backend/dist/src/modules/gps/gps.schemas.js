"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocationSchema = exports.gpsLockParamsSchema = void 0;
const zod_1 = require("zod");
exports.gpsLockParamsSchema = zod_1.z.object({
    lockId: zod_1.z.string().uuid(),
});
exports.createLocationSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    accuracy: zod_1.z.number().optional(),
    speed: zod_1.z.number().optional(),
    heading: zod_1.z.number().optional(),
    batteryLevel: zod_1.z.number().int().min(0).max(100).optional(),
    signalLevel: zod_1.z.number().int().min(0).max(100).optional(),
    source: zod_1.z.string().optional(),
    rawPayload: zod_1.z.unknown().optional(),
    recordedAt: zod_1.z.coerce.date().optional(),
});
