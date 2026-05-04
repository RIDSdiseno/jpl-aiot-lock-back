"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLockSchema = exports.createLockSchema = exports.lockRouteParamsSchema = exports.lockIdParamsSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.lockIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.lockRouteParamsSchema = zod_1.z.object({
    lockId: zod_1.z.string().uuid(),
});
exports.createLockSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    internalCode: zod_1.z.string().min(1),
    serialNumber: zod_1.z.string().optional(),
    imei: zod_1.z.string().optional(),
    macAddress: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.LockStatus).optional(),
    connectionType: zod_1.z.nativeEnum(client_1.LockConnectionType).optional(),
    batteryLevel: zod_1.z.number().int().min(0).max(100).optional(),
    signalLevel: zod_1.z.number().int().min(0).max(100).optional(),
    firmwareVersion: zod_1.z.string().optional(),
    hardwareVersion: zod_1.z.string().optional(),
    lastConnectionAt: zod_1.z.coerce.date().optional(),
    lastSyncAt: zod_1.z.coerce.date().optional(),
    companyId: zod_1.z.string().uuid().optional(),
    branchId: zod_1.z.string().uuid().optional(),
});
exports.updateLockSchema = exports.createLockSchema.partial();
