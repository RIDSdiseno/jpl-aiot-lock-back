"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompanySchema = exports.createCompanySchema = exports.companyIdParamsSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.companyIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.createCompanySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    rut: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.CompanyStatus).optional(),
});
exports.updateCompanySchema = exports.createCompanySchema.partial();
