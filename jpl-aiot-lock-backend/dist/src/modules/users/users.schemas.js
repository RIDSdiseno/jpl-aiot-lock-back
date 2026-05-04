"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = exports.idParamsSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.idParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    phone: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
    companyId: zod_1.z.string().uuid().optional(),
    roleId: zod_1.z.string().uuid().optional(),
});
exports.updateUserSchema = exports.createUserSchema
    .omit({ password: true })
    .extend({ password: zod_1.z.string().min(8).optional() })
    .partial();
