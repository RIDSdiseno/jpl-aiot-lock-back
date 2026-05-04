import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

const roles = [
  "SUPER_ADMIN",
  "ADMIN_EMPRESA",
  "SUPERVISOR",
  "OPERADOR",
  "TECNICO",
  "VISUALIZADOR",
];

const permissions = [
  "users.read",
  "users.create",
  "users.update",
  "users.delete",
  "companies.read",
  "companies.create",
  "companies.update",
  "companies.delete",
  "devices.read",
  "devices.create",
  "devices.update",
  "devices.delete",
  "devices.open",
  "devices.close",
  "devices.assign",
  "devices.revoke",
  "events.read",
  "commands.read",
  "commands.create",
  "gps.read",
  "alerts.read",
  "alerts.update",
  "dashboard.read",
  "reports.read",
  "audit.read",
  "maintenance.read",
  "maintenance.create",
  "maintenance.update",
];

function permissionName(code: string) {
  return code
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }

  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name: permissionName(code) },
      create: { code, name: permissionName(code) },
    });
  }

  const superAdmin = await prisma.role.findUniqueOrThrow({
    where: { name: "SUPER_ADMIN" },
  });
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdmin.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdmin.id,
        permissionId: permission.id,
      },
    });
  }

  const passwordHash = await hashPassword("123456");

  await prisma.user.upsert({
    where: { email: "JPL" },
    update: {
      name: "JPL",
      passwordHash,
      status: "ACTIVE",
      companyId: null,
      roleId: superAdmin.id,
    },
    create: {
      name: "JPL",
      email: "JPL",
      passwordHash,
      status: "ACTIVE",
      companyId: null,
      roleId: superAdmin.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
