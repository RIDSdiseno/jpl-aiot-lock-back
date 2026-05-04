"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
const prisma_1 = require("../../config/prisma");
function createAuditLog(data) {
    return prisma_1.prisma.auditLog.create({ data });
}
