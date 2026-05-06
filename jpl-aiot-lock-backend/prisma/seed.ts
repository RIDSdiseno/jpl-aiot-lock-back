import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();
const seedPrefix = "[SEED][JPL-AIOT]";

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
  "monitoring.read",
  "monitoring.command",
  "monitoring.unseal",
  "monitoring.password",
  "monitoring.nfc",
  "geofences.read",
  "dashboard.read",
  "reports.read",
  "audit.read",
  "maintenance.read",
  "maintenance.create",
  "maintenance.update",
];

const demoDevices = [
  ["JPL-DEMO-001", "Candado DEMO Norte", "ONLINE", 92, 88, -33.4372, -70.6506],
  ["JPL-DEMO-002", "Candado DEMO Centro", "ONLINE", 67, 71, -33.4489, -70.6693],
  ["JPL-DEMO-003", "Candado DEMO Ruta 68", "OFFLINE", 41, 0, -33.4548, -70.7304],
  ["JPL-DEMO-004", "Candado DEMO Maipu", "ONLINE", 78, 82, -33.5102, -70.7564],
  ["JPL-DEMO-005", "Candado DEMO Quilicura", "OFFLINE", 25, 0, -33.3571, -70.7293],
  ["JPL-DEMO-006", "Candado DEMO San Bernardo", "ONLINE", 84, 76, -33.5922, -70.6996],
] as const;

const jplDemoUsers = [
  ["admin.operacional@jpl-demo.local", "Admin Operacional", "ADMIN_EMPRESA"],
  ["operador.monitoreo@jpl-demo.local", "Operador Monitoreo", "OPERADOR"],
  ["supervisor.seguridad@jpl-demo.local", "Supervisor Seguridad", "SUPERVISOR"],
  ["tecnico.mantencion@jpl-demo.local", "Tecnico Mantencion", "TECNICO"],
] as const;

const jplLocks = [
  {
    code: "LOCK-JPL-001",
    name: "Candado Camion Santiago 001",
    status: "ACTIVE",
    connectionStatus: "ONLINE",
    battery: 87,
    signal: 82,
    lat: -33.4489,
    lng: -70.6693,
    speed: 0,
    lastSeenMinutesAgo: 3,
    alarm: "Normal",
  },
  {
    code: "LOCK-JPL-002",
    name: "Candado Contenedor Norte 002",
    status: "LOST_SIGNAL",
    connectionStatus: "OFFLINE",
    battery: 42,
    signal: 0,
    lat: -33.3891,
    lng: -70.6174,
    speed: 0,
    lastSeenMinutesAgo: 360,
    alarm: "Device offline",
  },
  {
    code: "LOCK-JPL-003",
    name: "Candado Ruta Valparaiso 003",
    status: "ACTIVE",
    connectionStatus: "ONLINE",
    battery: 65,
    signal: 58,
    lat: -33.191,
    lng: -71.105,
    speed: 52,
    lastSeenMinutesAgo: 5,
    alarm: "Normal",
  },
  {
    code: "LOCK-JPL-004",
    name: "Candado Alarma Corte 004",
    status: "BLOCKED",
    connectionStatus: "ONLINE",
    battery: 74,
    signal: 86,
    lat: -33.461,
    lng: -70.653,
    speed: 0,
    lastSeenMinutesAgo: 2,
    alarm: "Cut/demolition alarm active",
  },
  {
    code: "LOCK-JPL-005",
    name: "Candado Bodega Central 005",
    status: "LOCKED",
    connectionStatus: "ONLINE",
    battery: 95,
    signal: 91,
    lat: -33.4372,
    lng: -70.6506,
    speed: 0,
    lastSeenMinutesAgo: 4,
    alarm: "Normal",
  },
  {
    code: "LOCK-JPL-006",
    name: "Candado Fuera de Geocerca 006",
    status: "BLOCKED",
    connectionStatus: "ONLINE",
    battery: 51,
    signal: 55,
    lat: -33.431,
    lng: -70.697,
    speed: 38,
    lastSeenMinutesAgo: 6,
    alarm: "Geofence exit",
  },
  {
    code: "LOCK-JPL-007",
    name: "Candado Baja Bateria 007",
    status: "LOW_BATTERY",
    connectionStatus: "ONLINE",
    battery: 12,
    signal: 24,
    lat: -33.455,
    lng: -70.67,
    speed: 0,
    lastSeenMinutesAgo: 7,
    alarm: "Low battery",
  },
  {
    code: "LOCK-JPL-008",
    name: "Candado Sin Reporte 008",
    status: "LOST_SIGNAL",
    connectionStatus: "OFFLINE",
    battery: 0,
    signal: 0,
    lat: -33.47,
    lng: -70.71,
    speed: 0,
    lastSeenMinutesAgo: 1440,
    alarm: "No recent report",
  },
] as const;

const jplGeofences = [
  {
    id: "jpl-demo-geofence-santiago",
    name: "Zona Operacional Santiago",
    description: "Zona circular para operaciones urbanas de Santiago.",
    centerLat: -33.4489,
    centerLng: -70.6693,
    radiusMt: 500,
  },
  {
    id: "jpl-demo-geofence-valparaiso",
    name: "Puerto Valparaiso",
    description: "Zona circular demo alrededor del Puerto de Valparaiso.",
    centerLat: -33.0472,
    centerLng: -71.6127,
    radiusMt: 700,
  },
  {
    id: "jpl-demo-geofence-bodega",
    name: "Bodega Central JPL",
    description: "Geocerca de bodega central para pruebas de permanencia.",
    centerLat: -33.4372,
    centerLng: -70.6506,
    radiusMt: 300,
  },
  {
    id: "jpl-demo-geofence-restringida",
    name: "Zona Restringida Demo",
    description: "Zona restringida para validar alertas de entrada y salida.",
    centerLat: -33.4315,
    centerLng: -70.681,
    radiusMt: 250,
  },
] as const;

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000);
}

function permissionName(code: string) {
  return code
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function main() {
  console.log(`${seedPrefix} Starting demo seed`);

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

  const demoCompany = await prisma.company.upsert({
    where: { id: "demo-company" },
    update: { name: "DEMO", status: "ACTIVE" },
    create: { id: "demo-company", name: "DEMO", status: "ACTIVE" },
  });

  for (const [internalCode, name, connectionStatus, batteryLevel, signalLevel, latitude, longitude] of demoDevices) {
    const lock = await prisma.lock.upsert({
      where: { internalCode },
      update: {
        name,
        companyId: demoCompany.id,
        connectionStatus,
        batteryLevel,
        signalLevel,
        lastConnectionAt: new Date(),
      },
      create: {
        name,
        internalCode,
        imei: `89560700000000${internalCode.at(-1)}`,
        companyId: demoCompany.id,
        connectionType: "LTE",
        connectionStatus,
        batteryLevel,
        signalLevel,
        lastConnectionAt: new Date(),
      },
    });

    await prisma.lockLocation.upsert({
      where: { id: `demo-location-${internalCode}` },
      update: {
        latitude,
        longitude,
        batteryLevel,
        signalLevel,
        speed: connectionStatus === "ONLINE" ? 12 : 0,
        source: "mock",
        recordedAt: new Date(),
      },
      create: {
        id: `demo-location-${internalCode}`,
        lockId: lock.id,
        latitude,
        longitude,
        batteryLevel,
        signalLevel,
        speed: connectionStatus === "ONLINE" ? 12 : 0,
        source: "mock",
      },
    });
  }

  await prisma.geofence.upsert({
    where: { id: "demo-fence-001" },
    update: {
      name: "Geocerca DEMO Santiago",
      companyId: demoCompany.id,
      centerLat: -33.4489,
      centerLng: -70.6693,
      radiusMt: 8500,
      isActive: true,
    },
    create: {
      id: "demo-fence-001",
      name: "Geocerca DEMO Santiago",
      companyId: demoCompany.id,
      centerLat: -33.4489,
      centerLng: -70.6693,
      radiusMt: 8500,
      isActive: true,
    },
  });

  const jplCompany = await prisma.company.upsert({
    where: { id: "jpl-demo-company" },
    update: {
      name: "JPL Operaciones Demo",
      rut: "JPL-DEMO",
      status: "ACTIVE",
    },
    create: {
      id: "jpl-demo-company",
      name: "JPL Operaciones Demo",
      rut: "JPL-DEMO",
      status: "ACTIVE",
    },
  });
  console.log(`${seedPrefix} Organizations created`);

  for (const [email, name, roleName] of jplDemoUsers) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    await prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        status: "ACTIVE",
        companyId: jplCompany.id,
        roleId: role.id,
      },
      create: {
        email,
        name,
        passwordHash,
        status: "ACTIVE",
        companyId: jplCompany.id,
        roleId: role.id,
      },
    });
  }

  const operator = await prisma.user.findUniqueOrThrow({
    where: { email: "operador.monitoreo@jpl-demo.local" },
  });

  const locksByCode = new Map<string, { id: string; code: string }>();

  for (const lockData of jplLocks) {
    const lock = await prisma.lock.upsert({
      where: { internalCode: lockData.code },
      update: {
        name: lockData.name,
        status: lockData.status,
        connectionStatus: lockData.connectionStatus,
        batteryLevel: lockData.battery,
        signalLevel: lockData.signal,
        lastConnectionAt: minutesAgo(lockData.lastSeenMinutesAgo),
        lastSyncAt: lockData.connectionStatus === "ONLINE" ? minutesAgo(lockData.lastSeenMinutesAgo) : null,
        companyId: jplCompany.id,
        connectionType: "LTE",
        firmwareVersion: "1.8.3-demo",
        hardwareVersion: "JPL-SL-2",
      },
      create: {
        name: lockData.name,
        internalCode: lockData.code,
        serialNumber: `${lockData.code}-SN`,
        imei: `89560710000000${lockData.code.slice(-3)}`,
        macAddress: `02:4A:50:4C:00:${lockData.code.slice(-2)}`,
        status: lockData.status,
        connectionStatus: lockData.connectionStatus,
        batteryLevel: lockData.battery,
        signalLevel: lockData.signal,
        lastConnectionAt: minutesAgo(lockData.lastSeenMinutesAgo),
        lastSyncAt: lockData.connectionStatus === "ONLINE" ? minutesAgo(lockData.lastSeenMinutesAgo) : null,
        companyId: jplCompany.id,
        connectionType: "LTE",
        firmwareVersion: "1.8.3-demo",
        hardwareVersion: "JPL-SL-2",
      },
    });

    locksByCode.set(lockData.code, { id: lock.id, code: lockData.code });

    await prisma.lockLocation.upsert({
      where: { id: `jpl-demo-location-current-${lockData.code}` },
      update: {
        latitude: lockData.lat,
        longitude: lockData.lng,
        speed: lockData.speed,
        heading: lockData.speed > 0 ? 278 : 0,
        batteryLevel: lockData.battery,
        signalLevel: lockData.signal,
        recordedAt: minutesAgo(lockData.lastSeenMinutesAgo),
        rawPayload: {
          signal: lockData.signal === 0 ? "NONE" : lockData.signal < 35 ? "LOW" : lockData.signal < 70 ? "MEDIUM" : "GOOD",
          gpsValid: lockData.connectionStatus === "ONLINE",
          alarm: lockData.alarm,
        },
      },
      create: {
        id: `jpl-demo-location-current-${lockData.code}`,
        lockId: lock.id,
        latitude: lockData.lat,
        longitude: lockData.lng,
        speed: lockData.speed,
        heading: lockData.speed > 0 ? 278 : 0,
        batteryLevel: lockData.battery,
        signalLevel: lockData.signal,
        source: "jpl-demo-seed",
        recordedAt: minutesAgo(lockData.lastSeenMinutesAgo),
        rawPayload: {
          signal: lockData.signal === 0 ? "NONE" : lockData.signal < 35 ? "LOW" : lockData.signal < 70 ? "MEDIUM" : "GOOD",
          gpsValid: lockData.connectionStatus === "ONLINE",
          alarm: lockData.alarm,
        },
      },
    });
  }
  console.log(`${seedPrefix} Devices created`);

  for (const geofence of jplGeofences) {
    await prisma.geofence.upsert({
      where: { id: geofence.id },
      update: {
        name: geofence.name,
        description: geofence.description,
        companyId: jplCompany.id,
        centerLat: geofence.centerLat,
        centerLng: geofence.centerLng,
        radiusMt: geofence.radiusMt,
        isActive: true,
      },
      create: {
        id: geofence.id,
        name: geofence.name,
        description: geofence.description,
        companyId: jplCompany.id,
        centerLat: geofence.centerLat,
        centerLng: geofence.centerLng,
        radiusMt: geofence.radiusMt,
        isActive: true,
      },
    });
  }
  console.log(`${seedPrefix} Geofences created`);

  const trackingPlans = [
    {
      code: "LOCK-JPL-001",
      points: [
        [-33.4511, -70.6721, 0, 20],
        [-33.4504, -70.6714, 8, 16],
        [-33.4498, -70.6707, 11, 12],
        [-33.4493, -70.67, 6, 8],
        [-33.4489, -70.6693, 0, 3],
      ],
    },
    {
      code: "LOCK-JPL-003",
      points: [
        [-33.4489, -70.6693, 0, 80],
        [-33.4201, -70.815, 42, 70],
        [-33.382, -70.981, 58, 60],
        [-33.305, -71.12, 64, 50],
        [-33.247, -71.258, 61, 40],
        [-33.176, -71.392, 55, 30],
        [-33.101, -71.515, 49, 20],
        [-33.0472, -71.6127, 15, 5],
      ],
    },
    {
      code: "LOCK-JPL-006",
      points: [
        [-33.4372, -70.6506, 0, 45],
        [-33.4364, -70.654, 12, 36],
        [-33.4349, -70.662, 24, 28],
        [-33.4333, -70.674, 35, 18],
        [-33.431, -70.697, 38, 6],
      ],
    },
  ] as const;

  for (const plan of trackingPlans) {
    const lock = locksByCode.get(plan.code);
    if (!lock) continue;
    for (const [index, point] of plan.points.entries()) {
      const [latitude, longitude, speed, minutes] = point;
      const lockData = jplLocks.find((item) => item.code === plan.code)!;
      await prisma.lockLocation.upsert({
        where: { id: `jpl-demo-tracking-${plan.code}-${index + 1}` },
        update: {
          latitude,
          longitude,
          speed,
          heading: speed > 0 ? 276 : 0,
          recordedAt: minutesAgo(minutes),
          batteryLevel: Math.max(0, lockData.battery - Math.floor(index / 2)),
          signalLevel: lockData.signal,
        },
        create: {
          id: `jpl-demo-tracking-${plan.code}-${index + 1}`,
          lockId: lock.id,
          latitude,
          longitude,
          speed,
          heading: speed > 0 ? 276 : 0,
          source: "jpl-demo-seed",
          recordedAt: minutesAgo(minutes),
          batteryLevel: Math.max(0, lockData.battery - Math.floor(index / 2)),
          signalLevel: lockData.signal,
          rawPayload: { signal: lockData.signal, demoPath: plan.code },
        },
      });
    }
  }
  console.log(`${seedPrefix} Tracking points created`);

  const eventTypes = [
    ["LOCK-JPL-001", "DEVICE_REGISTERED", "DEVICE_ONLINE", "Dispositivo en linea"],
    ["LOCK-JPL-002", "SIGNAL_LOST", "DEVICE_OFFLINE", "Dispositivo fuera de linea"],
    ["LOCK-JPL-003", "GPS_UPDATED", "LOCATION_REPORTED", "Ubicacion reportada en ruta"],
    ["LOCK-JPL-001", "OPENED", "LOCK_OPENED", "Candado abierto"],
    ["LOCK-JPL-005", "CLOSED", "LOCK_CLOSED", "Candado cerrado"],
    ["LOCK-JPL-001", "OPEN_REQUESTED", "REMOTE_UNLOCK_REQUESTED", "Solicitud remota de apertura"],
    ["LOCK-JPL-005", "ACCESS_GRANTED", "NFC_AUTH_SUCCESS", "Autorizacion NFC exitosa"],
    ["LOCK-JPL-003", "ACCESS_DENIED", "NFC_AUTH_FAILED", "Autorizacion NFC rechazada"],
    ["LOCK-JPL-001", "COMMAND_SUCCESS", "DYNAMIC_PASSWORD_GENERATED", "Clave dinamica generada"],
    ["LOCK-JPL-003", "DEVICE_UPDATED", "PARAMETER_UPDATED", "Parametros actualizados"],
  ] as const;

  for (const [index, [code, type, label, message]] of eventTypes.entries()) {
    const lock = locksByCode.get(code);
    if (!lock) continue;
    const lockData = jplLocks.find((item) => item.code === code)!;
    await prisma.lockEvent.upsert({
      where: { id: `jpl-demo-event-${index + 1}` },
      update: {
        type,
        message,
        latitude: lockData.lat,
        longitude: lockData.lng,
        batteryLevel: lockData.battery,
        signalLevel: lockData.signal,
        createdAt: minutesAgo(90 - index * 7),
        rawPayload: { eventType: label },
      },
      create: {
        id: `jpl-demo-event-${index + 1}`,
        lockId: lock.id,
        userId: operator.id,
        type,
        message,
        latitude: lockData.lat,
        longitude: lockData.lng,
        batteryLevel: lockData.battery,
        signalLevel: lockData.signal,
        createdAt: minutesAgo(90 - index * 7),
        rawPayload: { eventType: label },
      },
    });
  }
  console.log(`${seedPrefix} Events created`);

  const alarms = [
    ["LOCK-JPL-004", "CUT_ALARM", "CRITICAL", "OPEN", "Alarma critica por corte/demolicion activa.", 35, null],
    ["LOCK-JPL-006", "GEOFENCE_EXIT", "CRITICAL", "OPEN", "Candado salio de la geocerca asignada.", 25, null],
    ["LOCK-JPL-007", "LOW_BATTERY", "WARNING", "OPEN", "Bateria baja: 12%.", 20, null],
    ["LOCK-JPL-002", "DEVICE_OFFLINE", "WARNING", "ACKNOWLEDGED", "Dispositivo offline desde hace varias horas.", 240, null],
    ["LOCK-JPL-008", "NO_RECENT_REPORT", "CRITICAL", "OPEN", "Sin reporte reciente en las ultimas 24 horas.", 1440, null],
    ["LOCK-JPL-004", "DEMOLITION_ALARM", "CRITICAL", "RESOLVED", "Evento de demolicion anterior resuelto.", 600, 420],
  ] as const;

  for (const [index, [code, type, severity, status, message, createdAgo, resolvedAgo]] of alarms.entries()) {
    const lock = locksByCode.get(code);
    if (!lock) continue;
    await prisma.alert.upsert({
      where: { id: `jpl-demo-alarm-${index + 1}` },
      update: {
        title: type,
        message,
        severity,
        status,
        createdAt: minutesAgo(createdAgo),
        resolvedAt: resolvedAgo ? minutesAgo(resolvedAgo) : null,
        rawPayload: {
          type,
          demoSeverity: severity === "WARNING" ? "MEDIUM" : "CRITICAL",
          demoStatus: status === "RESOLVED" ? "RESOLVED" : "ACTIVE",
        },
      },
      create: {
        id: `jpl-demo-alarm-${index + 1}`,
        lockId: lock.id,
        title: type,
        message,
        severity,
        status,
        createdAt: minutesAgo(createdAgo),
        resolvedAt: resolvedAgo ? minutesAgo(resolvedAgo) : null,
        rawPayload: {
          type,
          demoSeverity: severity === "WARNING" ? "MEDIUM" : "CRITICAL",
          demoStatus: status === "RESOLVED" ? "RESOLVED" : "ACTIVE",
        },
      },
    });
  }
  console.log(`${seedPrefix} Alarms created`);

  const cards = [
    ["NFC-JPL-001", "Operador Ruta Santiago", "active", ["LOCK-JPL-001", "LOCK-JPL-005"]],
    ["NFC-JPL-002", "Operador Ruta Valparaiso", "active", ["LOCK-JPL-003"]],
    ["NFC-JPL-003", "Tarjeta Bloqueada Demo", "blocked", []],
  ] as const;

  try {
    for (const [cardNo, holder, status, codes] of cards) {
      const card = await prisma.nfcCard.upsert({
        where: { cardNo },
        update: { holder, status },
        create: { cardNo, holder, status },
      });

      for (const code of codes) {
        await prisma.deviceNfcCard.upsert({
          where: {
            deviceId_nfcCardId: {
              deviceId: code,
              nfcCardId: card.id,
            },
          },
          update: { syncedAt: minutesAgo(10) },
          create: {
            deviceId: code,
            nfcCardId: card.id,
            syncedAt: minutesAgo(10),
          },
        });
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("public.NfcCard")) {
      console.warn(`${seedPrefix} NFC tables not found. Run prisma db push or a migration to seed NFC cards.`);
    } else {
      throw error;
    }
  }

  const commandRows = [
    ["LOCK-JPL-001", "UNLOCK", "SENT", "REMOTE_UNLOCK_REQUESTED"],
    ["LOCK-JPL-005", "LOCK", "ACKNOWLEDGED", "LOCK"],
    ["LOCK-JPL-002", "REQUEST_STATUS", "PENDING", "REQUEST_STATUS"],
    ["LOCK-JPL-003", "SYNC", "ACKNOWLEDGED", "UPDATE_PARAMETERS"],
    ["LOCK-JPL-008", "SYNC", "FAILED", "OTA_UPDATE_REQUESTED"],
    ["LOCK-JPL-001", "SYNC", "SUCCESS", "DYNAMIC_PASSWORD_ACTIVE"],
    ["LOCK-JPL-003", "SYNC", "EXPIRED", "DYNAMIC_PASSWORD_EXPIRED"],
    ["LOCK-JPL-005", "SYNC", "SUCCESS", "DYNAMIC_PASSWORD_USED"],
  ] as const;

  for (const [index, [code, type, status, label]] of commandRows.entries()) {
    const lock = locksByCode.get(code);
    if (!lock) continue;
    await prisma.lockCommand.upsert({
      where: { id: `jpl-demo-command-${index + 1}` },
      update: {
        type,
        status,
        userId: operator.id,
        requestPayload: {
          command: label,
          dynamicPassword:
            label === "DYNAMIC_PASSWORD_ACTIVE"
              ? { code: "482931", validFrom: minutesAgo(5), validUntil: minutesAgo(-55), status: "ACTIVE" }
              : label === "DYNAMIC_PASSWORD_EXPIRED"
                ? { code: "193847", validFrom: minutesAgo(180), validUntil: minutesAgo(60), status: "EXPIRED" }
                : label === "DYNAMIC_PASSWORD_USED"
                  ? { code: "774210", validFrom: minutesAgo(120), validUntil: minutesAgo(-20), status: "USED", usedAt: minutesAgo(30) }
                  : undefined,
        },
        sentAt: ["SENT", "ACKNOWLEDGED", "SUCCESS", "FAILED"].includes(status) ? minutesAgo(14 - index) : null,
        acknowledgedAt: ["ACKNOWLEDGED", "SUCCESS"].includes(status) ? minutesAgo(10 - index) : null,
        completedAt: ["SUCCESS", "FAILED", "EXPIRED"].includes(status) ? minutesAgo(8 - index) : null,
      },
      create: {
        id: `jpl-demo-command-${index + 1}`,
        lockId: lock.id,
        userId: operator.id,
        type,
        status,
        requestPayload: {
          command: label,
          dynamicPassword:
            label === "DYNAMIC_PASSWORD_ACTIVE"
              ? { code: "482931", validFrom: minutesAgo(5), validUntil: minutesAgo(-55), status: "ACTIVE" }
              : label === "DYNAMIC_PASSWORD_EXPIRED"
                ? { code: "193847", validFrom: minutesAgo(180), validUntil: minutesAgo(60), status: "EXPIRED" }
                : label === "DYNAMIC_PASSWORD_USED"
                  ? { code: "774210", validFrom: minutesAgo(120), validUntil: minutesAgo(-20), status: "USED", usedAt: minutesAgo(30) }
                  : undefined,
        },
        sentAt: ["SENT", "ACKNOWLEDGED", "SUCCESS", "FAILED"].includes(status) ? minutesAgo(14 - index) : null,
        acknowledgedAt: ["ACKNOWLEDGED", "SUCCESS"].includes(status) ? minutesAgo(10 - index) : null,
        completedAt: ["SUCCESS", "FAILED", "EXPIRED"].includes(status) ? minutesAgo(8 - index) : null,
        expiresAt: minutesAgo(-30),
      },
    });
  }

  const deviceTypes = ["G_LOCK", "B_LOCK", "B_LOCK", "SMART_LOCK", "GPS_TRACKER", "E_SEAL"] as const;
  const productModels = ["G300N", "B168", "B102", "G310N", "GT06N", "ES200"] as const;
  const onlineStatuses = ["ONLINE", "OFFLINE", "OFFLINE", "OFFLINE", "DORMANT", "ALARM", "MAINTENANCE", "UPDATING"] as const;

  for (let index = 1; index <= 520; index += 1) {
    const type = deviceTypes[index % deviceTypes.length];
    const model = productModels[index % productModels.length];
    const onlineStatus = onlineStatuses[index % onlineStatuses.length];
    const deviceId = `JPL-AIOT-${String(index).padStart(5, "0")}`;
    const lat = -33.4489 + (index % 30) * 0.006;
    const lng = -70.6693 - (index % 25) * 0.006;
    await prisma.device.upsert({
      where: { deviceId },
      update: {
        name: `JPL ${model} ${String(index).padStart(3, "0")}`,
        deviceType: type,
        productModel: model,
        companyId: jplCompany.id,
        firmwareVersion: `2.${index % 8}.${index % 10}`,
        batteryLevel: Math.max(5, 100 - (index % 95)),
        signalStrength: onlineStatus === "OFFLINE" ? 0 : 30 + (index % 70),
        onlineStatus,
        lockStatus: index % 3 === 0 ? "LOCKED" : "UNLOCKED",
        shackleStatus: index % 4 === 0 ? "OPEN" : "CLOSED",
        lastConnectionAt: minutesAgo(index % 1440),
        lastLocationLat: lat,
        lastLocationLng: lng,
        lastAddress: `Mock address ${index}, Santiago`,
        notes: "Persistent mock device for HHDlink Device Management",
      },
      create: {
        deviceId,
        name: `JPL ${model} ${String(index).padStart(3, "0")}`,
        deviceType: type,
        productModel: model,
        companyId: jplCompany.id,
        imei: `9900000000${String(index).padStart(5, "0")}`,
        serialNumber: `SN-JPL-${String(index).padStart(5, "0")}`,
        simNumber: `SIM-${String(index).padStart(5, "0")}`,
        iccid: `895607${String(index).padStart(14, "0")}`,
        firmwareVersion: `2.${index % 8}.${index % 10}`,
        hardwareVersion: "JPL-HW-2",
        bluetoothName: `JPL-BLE-${String(index).padStart(5, "0")}`,
        batteryLevel: Math.max(5, 100 - (index % 95)),
        signalStrength: onlineStatus === "OFFLINE" ? 0 : 30 + (index % 70),
        onlineStatus,
        lockStatus: index % 3 === 0 ? "LOCKED" : "UNLOCKED",
        shackleStatus: index % 4 === 0 ? "OPEN" : "CLOSED",
        lastConnectionAt: minutesAgo(index % 1440),
        lastLocationLat: lat,
        lastLocationLng: lng,
        lastAddress: `Mock address ${index}, Santiago`,
        notes: "Persistent mock device for HHDlink Device Management",
      },
    });

    if (index <= 120) {
      await prisma.deviceHistoryData.upsert({
        where: { id: `history-${deviceId}` },
        update: {
          reportType: index % 5 === 0 ? "SUPPLEMENTARY" : "REALTIME",
          reportedAt: minutesAgo(index * 3),
          longitude: lng,
          latitude: lat,
          address: `Mock address ${index}, Santiago`,
          lockStatus: index % 3 === 0 ? "LOCKED" : "UNLOCKED",
          shackleStatus: index % 4 === 0 ? "OPEN" : "CLOSED",
          batteryLevel: Math.max(5, 100 - (index % 95)),
          signalStrength: onlineStatus === "OFFLINE" ? 0 : 30 + (index % 70),
          temperature: 18 + (index % 14),
          speed: index % 6 === 0 ? 42 : 0,
          rawPayloadJson: { mock: true, frame: index, onlineStatus },
        },
        create: {
          id: `history-${deviceId}`,
          deviceId,
          reportType: index % 5 === 0 ? "SUPPLEMENTARY" : "REALTIME",
          reportedAt: minutesAgo(index * 3),
          longitude: lng,
          latitude: lat,
          address: `Mock address ${index}, Santiago`,
          lockStatus: index % 3 === 0 ? "LOCKED" : "UNLOCKED",
          shackleStatus: index % 4 === 0 ? "OPEN" : "CLOSED",
          batteryLevel: Math.max(5, 100 - (index % 95)),
          signalStrength: onlineStatus === "OFFLINE" ? 0 : 30 + (index % 70),
          temperature: 18 + (index % 14),
          speed: index % 6 === 0 ? 42 : 0,
          rawPayloadJson: { mock: true, frame: index, onlineStatus },
        },
      });
    }

    if (index <= 12) {
      await prisma.deviceAlarmPolicy.upsert({
        where: { id: `alarm-policy-${deviceId}` },
        update: {
          receivePhones: "+56911112222",
          receiveEmails: "ops@jpl-demo.local",
          pushSmsEnabled: true,
          pushEmailEnabled: true,
          sendingEventTypes: "ALL_ALARMS,LOW_BATTERY_ALARM,GEOFENCE_ALARM,TAMPER_ALARM",
          enabled: true,
          remarks: "Default mock push policy",
        },
        create: {
          id: `alarm-policy-${deviceId}`,
          deviceId,
          receivePhones: "+56911112222",
          receiveEmails: "ops@jpl-demo.local",
          pushSmsEnabled: true,
          pushEmailEnabled: true,
          sendingEventTypes: "ALL_ALARMS,LOW_BATTERY_ALARM,GEOFENCE_ALARM,TAMPER_ALARM",
          enabled: true,
          remarks: "Default mock push policy",
          createdById: operator.id,
        },
      });
    }
  }

  for (const firmware of [
    ["G_LOCK", "G300N", "MASTER_MCU", "G300N-main-2.4.1.bin", "2.4.1", 204800],
    ["B_LOCK", "B168", "BLUETOOTH_MCU", "B168-ble-1.9.0.zip", "1.9.0", 102400],
    ["SMART_LOCK", "G310N", "MASTER_MCU", "G310N-main-3.1.2.bin", "3.1.2", 307200],
  ] as const) {
    const [deviceType, productModel, firmwareType, fileName, versionName, fileSize] = firmware;
    await prisma.firmwareFile.upsert({
      where: { deviceType_productModel_firmwareType_versionName: { deviceType, productModel, firmwareType, versionName } },
      update: { fileName, filePath: `/firmware/${fileName}`, fileSize, description: "Mock firmware package", uploadedById: operator.id },
      create: { deviceType, productModel, firmwareType, versionName, fileName, filePath: `/firmware/${fileName}`, fileSize, description: "Mock firmware package", uploadedById: operator.id },
    });
  }

  const historyDevices = await prisma.device.findMany({ where: { deletedAt: null }, take: 1000 });
  for (let index = 1; index <= 1000; index += 1) {
    const device = historyDevices[index % Math.max(1, historyDevices.length)];
    if (!device) break;
    const company = device.companyId ? await prisma.company.findUnique({ where: { id: device.companyId } }) : null;
    await prisma.deviceHistoryData.upsert({
      where: { id: `hhdlink-history-${index}` },
      update: {
        deviceId: device.deviceId,
        deviceName: device.name,
        deviceType: device.deviceType,
        productModel: device.productModel,
        companyId: device.companyId,
        companyName: company?.name,
        reportType: index % 5 === 0 ? "SUPPLEMENTARY" : "REALTIME",
        reportedAt: minutesAgo(index * 2),
        longitude: (device.lastLocationLng ?? -70.6693) - (index % 20) * 0.001,
        latitude: (device.lastLocationLat ?? -33.4489) + (index % 20) * 0.001,
        address: device.lastAddress ?? `HHDlink mock address ${index}`,
        lockStatus: index % 3 === 0 ? "LOCKED" : index % 3 === 1 ? "UNLOCKED" : "UNKNOWN",
        shackleStatus: index % 7 === 0 ? "TAMPERED" : index % 5 === 0 ? "CUT" : index % 2 === 0 ? "OPEN" : "CLOSED",
        batteryLevel: Math.max(1, 100 - (index % 98)),
        signalStrength: 20 + (index % 80),
        temperature: 15 + (index % 18),
        speed: index % 4 === 0 ? 35 + (index % 40) : 0,
        firmwareVersion: device.firmwareVersion,
        rawPayloadJson: { source: "HHDLINK_MOCK", seq: index, supplementary: index % 5 === 0 },
        source: "MOCK",
      },
      create: {
        id: `hhdlink-history-${index}`,
        deviceId: device.deviceId,
        deviceName: device.name,
        deviceType: device.deviceType,
        productModel: device.productModel,
        companyId: device.companyId,
        companyName: company?.name,
        reportType: index % 5 === 0 ? "SUPPLEMENTARY" : "REALTIME",
        reportedAt: minutesAgo(index * 2),
        longitude: (device.lastLocationLng ?? -70.6693) - (index % 20) * 0.001,
        latitude: (device.lastLocationLat ?? -33.4489) + (index % 20) * 0.001,
        address: device.lastAddress ?? `HHDlink mock address ${index}`,
        lockStatus: index % 3 === 0 ? "LOCKED" : index % 3 === 1 ? "UNLOCKED" : "UNKNOWN",
        shackleStatus: index % 7 === 0 ? "TAMPERED" : index % 5 === 0 ? "CUT" : index % 2 === 0 ? "OPEN" : "CLOSED",
        batteryLevel: Math.max(1, 100 - (index % 98)),
        signalStrength: 20 + (index % 80),
        temperature: 15 + (index % 18),
        speed: index % 4 === 0 ? 35 + (index % 40) : 0,
        firmwareVersion: device.firmwareVersion,
        rawPayloadJson: { source: "HHDLINK_MOCK", seq: index, supplementary: index % 5 === 0 },
        source: "MOCK",
      },
    });
  }

  const firmwareFiles = await prisma.firmwareFile.findMany({ where: { deletedAt: null }, take: 4 });
  for (let index = 0; index < Math.min(8, historyDevices.length, firmwareFiles.length * 2); index += 1) {
    const device = historyDevices[index];
    const firmware = firmwareFiles.find((item) => item.deviceType === device.deviceType && item.productModel === device.productModel) ?? firmwareFiles[index % firmwareFiles.length];
    if (!firmware) continue;
    await prisma.otaUpgradeRecord.upsert({
      where: { id: `hhdlink-ota-${index + 1}` },
      update: {
        deviceId: device.deviceId,
        deviceName: device.name,
        productModel: device.productModel,
        companyId: device.companyId,
        firmwareFileId: firmware.id,
        firmwareType: firmware.firmwareType,
        fromVersion: device.firmwareVersion,
        toVersion: firmware.versionName,
        targetVersion: firmware.versionName,
        status: ["PENDING", "UPDATING", "SUCCESS", "FAILED"][index % 4],
        progress: [0, 65, 100, 35][index % 4],
        startedAt: minutesAgo(120 - index * 10),
        finishedAt: index % 4 >= 2 ? minutesAgo(90 - index * 10) : null,
        errorMessage: index % 4 === 3 ? "Mock verification failed" : null,
        createdById: operator.id,
        createdByName: operator.name,
      },
      create: {
        id: `hhdlink-ota-${index + 1}`,
        deviceId: device.deviceId,
        deviceName: device.name,
        productModel: device.productModel,
        companyId: device.companyId,
        firmwareFileId: firmware.id,
        firmwareType: firmware.firmwareType,
        fromVersion: device.firmwareVersion,
        toVersion: firmware.versionName,
        targetVersion: firmware.versionName,
        status: ["PENDING", "UPDATING", "SUCCESS", "FAILED"][index % 4],
        progress: [0, 65, 100, 35][index % 4],
        startedAt: minutesAgo(120 - index * 10),
        finishedAt: index % 4 >= 2 ? minutesAgo(90 - index * 10) : null,
        errorMessage: index % 4 === 3 ? "Mock verification failed" : null,
        createdById: operator.id,
        createdByName: operator.name,
      },
    });
  }

  const diagnosisTypes = ["NETWORK", "BLUETOOTH", "HARDWARE", "FIRMWARE", "GPS", "NFC", "BATTERY", "COMMUNICATION"] as const;
  const logLevels = ["INFO", "WARNING", "ERROR", "CRITICAL"] as const;
  for (let index = 1; index <= 80; index += 1) {
    const device = historyDevices[index % Math.max(1, historyDevices.length)];
    if (!device) break;
    await prisma.deviceDiagnosisLog.upsert({
      where: { id: `hhdlink-diagnosis-${index}` },
      update: {
        deviceId: device.deviceId,
        deviceName: device.name,
        productModel: device.productModel,
        companyId: device.companyId,
        diagnosisType: diagnosisTypes[index % diagnosisTypes.length],
        logLevel: logLevels[index % logLevels.length],
        summary: `Mock diagnosis ${index} for ${device.deviceId}`,
        fullLog: `[${new Date().toISOString()}] Device ${device.deviceId} diagnostic frame ${index}\nNetwork RSSI=${device.signalStrength ?? 0}\nBattery=${device.batteryLevel ?? 0}`,
        rawPayloadJson: { source: "APP_BLUETOOTH", frame: index },
        source: index % 3 === 0 ? "APP_BLUETOOTH" : "MOCK",
        uploadedById: operator.id,
        uploadedByName: operator.name,
        uploadedAt: minutesAgo(index * 11),
      },
      create: {
        id: `hhdlink-diagnosis-${index}`,
        deviceId: device.deviceId,
        deviceName: device.name,
        productModel: device.productModel,
        companyId: device.companyId,
        diagnosisType: diagnosisTypes[index % diagnosisTypes.length],
        logLevel: logLevels[index % logLevels.length],
        summary: `Mock diagnosis ${index} for ${device.deviceId}`,
        fullLog: `[${new Date().toISOString()}] Device ${device.deviceId} diagnostic frame ${index}\nNetwork RSSI=${device.signalStrength ?? 0}\nBattery=${device.batteryLevel ?? 0}`,
        rawPayloadJson: { source: "APP_BLUETOOTH", frame: index },
        source: index % 3 === 0 ? "APP_BLUETOOTH" : "MOCK",
        uploadedById: operator.id,
        uploadedByName: operator.name,
        uploadedAt: minutesAgo(index * 11),
      },
    });
  }

  console.log(`${seedPrefix} Device management mock data created`);

  console.log(`${seedPrefix} Demo seed completed`);
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
