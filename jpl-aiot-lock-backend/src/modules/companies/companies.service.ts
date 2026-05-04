import { AuditAction } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createAuditLog } from "../audit/audit.service";
import { CreateCompanyInput, UpdateCompanyInput } from "./companies.schemas";

export function listCompanies() {
  return prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function getCompanyById(id: string) {
  return prisma.company.findFirstOrThrow({
    where: { id, deletedAt: null },
  });
}

export async function createCompany(data: CreateCompanyInput, actorId?: string) {
  const company = await prisma.company.create({ data });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.CREATE,
    entity: "Company",
    entityId: company.id,
    description: "Company created",
  });

  return company;
}

export async function updateCompany(id: string, data: UpdateCompanyInput, actorId?: string) {
  const company = await prisma.company.update({
    where: { id },
    data,
  });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.UPDATE,
    entity: "Company",
    entityId: id,
    description: "Company updated",
  });

  return company;
}

export async function deleteCompany(id: string, actorId?: string) {
  const company = await prisma.company.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    user: actorId ? { connect: { id: actorId } } : undefined,
    action: AuditAction.DELETE,
    entity: "Company",
    entityId: id,
    description: "Company soft deleted",
  });

  return company;
}
