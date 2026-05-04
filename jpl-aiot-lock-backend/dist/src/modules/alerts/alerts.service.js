"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAlerts = listAlerts;
exports.getAlertById = getAlertById;
exports.updateAlert = updateAlert;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const audit_service_1 = require("../audit/audit.service");
function listAlerts() {
    return prisma_1.prisma.alert.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
    });
}
function getAlertById(id) {
    return prisma_1.prisma.alert.findUniqueOrThrow({ where: { id } });
}
async function updateAlert(id, data, actorId) {
    const now = new Date();
    const alert = await prisma_1.prisma.alert.update({
        where: { id },
        data: {
            ...data,
            acknowledgedAt: data.status === client_1.AlertStatus.ACKNOWLEDGED ? now : undefined,
            resolvedAt: data.status === client_1.AlertStatus.RESOLVED ? now : undefined,
        },
    });
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.UPDATE,
        entity: "Alert",
        entityId: id,
        description: "Alert updated",
    });
    return alert;
}
