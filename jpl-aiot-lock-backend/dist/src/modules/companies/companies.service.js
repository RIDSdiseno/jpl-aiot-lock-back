"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCompanies = listCompanies;
exports.getCompanyById = getCompanyById;
exports.createCompany = createCompany;
exports.updateCompany = updateCompany;
exports.deleteCompany = deleteCompany;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const audit_service_1 = require("../audit/audit.service");
function listCompanies() {
    return prisma_1.prisma.company.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
    });
}
function getCompanyById(id) {
    return prisma_1.prisma.company.findFirstOrThrow({
        where: { id, deletedAt: null },
    });
}
async function createCompany(data, actorId) {
    const company = await prisma_1.prisma.company.create({ data });
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.CREATE,
        entity: "Company",
        entityId: company.id,
        description: "Company created",
    });
    return company;
}
async function updateCompany(id, data, actorId) {
    const company = await prisma_1.prisma.company.update({
        where: { id },
        data,
    });
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.UPDATE,
        entity: "Company",
        entityId: id,
        description: "Company updated",
    });
    return company;
}
async function deleteCompany(id, actorId) {
    const company = await prisma_1.prisma.company.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
    await (0, audit_service_1.createAuditLog)({
        user: actorId ? { connect: { id: actorId } } : undefined,
        action: client_1.AuditAction.DELETE,
        entity: "Company",
        entityId: id,
        description: "Company soft deleted",
    });
    return company;
}
