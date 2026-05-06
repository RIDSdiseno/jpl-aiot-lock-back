import type { ControlCompanyGroup, ControlDevice } from "../control.types";

const company = {
  companyId: "jpl-servicios-integrales",
  companyName: "JPL Servicios Integrales LTDA",
};

const devices: ControlDevice[] = [
  {
    id: "708049716934",
    deviceId: "708049716934",
    name: "708049716934[1-632-EM-001-A793-E...]",
    model: "G300",
    type: "AllType",
    status: "ONLINE",
    isOnline: true,
    hasActiveAlarm: false,
    selected: true,
    ...company,
  },
  {
    id: "708047661918",
    deviceId: "708047661918",
    name: "708047661918[632-TS-001-TALLER...]",
    model: "G300",
    type: "AllType",
    status: "OFFLINE",
    isOnline: false,
    hasActiveAlarm: false,
    ...company,
  },
  {
    id: "553071206102",
    deviceId: "553071206102",
    name: "553071206102[G300N24CL10001]",
    model: "G300N",
    type: "AllType",
    status: "SLEEP",
    isOnline: false,
    isSleep: true,
    hasActiveAlarm: false,
    ...company,
  },
  {
    id: "553071206110",
    deviceId: "553071206110",
    name: "553071206110[G300N24CL10002]",
    model: "G300N",
    type: "AllType",
    status: "ONLINE",
    isOnline: true,
    hasActiveAlarm: false,
    ...company,
  },
  {
    id: "553071206144",
    deviceId: "553071206144",
    name: "553071206144[G300N24CL10003]",
    model: "G300N",
    type: "AllType",
    status: "ALARM",
    isOnline: true,
    hasActiveAlarm: true,
    alarmType: "TAMPER",
    ...company,
  },
  {
    id: "553071206094",
    deviceId: "553071206094",
    name: "553071206094[G300N24CL10004]",
    model: "G300N",
    type: "AllType",
    status: "OFFLINE",
    isOnline: false,
    hasActiveAlarm: false,
    ...company,
  },
];

export function listControlDevices(status = "all", type = "AllType", search = ""): ControlCompanyGroup[] {
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = devices.filter((device) => {
    const statusMatch =
      status === "all" ||
      (status === "online" && device.status === "ONLINE") ||
      (status === "offline" && device.status === "OFFLINE") ||
      (status === "sleep" && device.status === "SLEEP");
    const typeMatch = type === "AllType" || device.type === type || device.model === type;
    const searchMatch =
      !normalizedSearch ||
      device.companyName.toLowerCase().includes(normalizedSearch) ||
      device.deviceId.toLowerCase().includes(normalizedSearch) ||
      (device.name ?? "").toLowerCase().includes(normalizedSearch);

    return statusMatch && typeMatch && searchMatch;
  });

  return [
    {
      companyId: company.companyId,
      companyName: company.companyName,
      devices: filtered,
    },
  ];
}

export function findControlDevice(deviceId: string) {
  return devices.find((device) => device.deviceId === deviceId || device.id === deviceId);
}
