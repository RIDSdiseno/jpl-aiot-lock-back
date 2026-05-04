"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccessSchema = exports.revokeAccessParamsSchema = exports.userLocksParamsSchema = exports.lockAccessParamsSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.lockAccessParamsSchema = zod_1.z.object({
    lockId: zod_1.z.string().uuid(),
});
exports.userLocksParamsSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
});
exports.revokeAccessParamsSchema = zod_1.z.object({
    lockId: zod_1.z.string().uuid(),
    accessId: zod_1.z.string().uuid(),
});
exports.createAccessSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    accessType: zod_1.z.nativeEnum(client_1.AccessType).optional(),
    status: zod_1.z.nativeEnum(client_1.AccessStatus).optional(),
    validFrom: zod_1.z.coerce.date().optional(),
    validTo: zod_1.z.coerce.date().optional(),
    allowedDays: zod_1.z.string().optional(),
    allowedFromTime: zod_1.z.string().optional(),
    allowedToTime: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
});
