"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAlertSchema = exports.alertIdParamsSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.alertIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.updateAlertSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).optional(),
    message: zod_1.z.string().min(2).optional(),
    severity: zod_1.z.nativeEnum(client_1.AlertSeverity).optional(),
    status: zod_1.z.nativeEnum(client_1.AlertStatus).optional(),
});
