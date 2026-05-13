import type { ParameterCategoryKey, ParameterDefinition, ParameterField, ParameterOption, ParameterUpdateInput, ParameterValue } from "./parameter.types";

export const parameterCategories: { key: ParameterCategoryKey; label: string }[] = [
  { key: "COMMUNICATION", label: "Communication" },
  { key: "TIME", label: "Time" },
  { key: "SHACKLE", label: "Shackle" },
  { key: "INSTRUCTION_SET", label: "Instruction Set" },
  { key: "BLUETOOTH", label: "Bluetooth" },
  { key: "LOCATION", label: "Location" },
  { key: "POWER_SUPPLY", label: "Power Supply" },
  { key: "SENSOR", label: "Sensor" },
  { key: "IC_CARD", label: "IC Card" },
  { key: "STORAGE", label: "Storage" },
  { key: "OTA", label: "OTA" },
];

const options = (values: Array<string | number | boolean>): ParameterOption[] => values.map((value) => ({ label: String(value), value }));
const enabledDisabled = options(["Enabled", "Disabled"]);

export const parameterSchema: ParameterDefinition[] = [
  { key: "scheduledReportingInterval", label: "Scheduled reporting interval (unit: seconds)", category: "COMMUNICATION", type: "number", value: 60, editable: true, unit: "seconds", min: 1 },
  { key: "terminalHeartbeatReportingInterval", label: "Terminal heart beat reporting interval (unit: seconds)", category: "COMMUNICATION", type: "number", value: 60, editable: true, unit: "seconds", min: 1 },
  { key: "specialScheduledReportingIntervalUnsealed", label: "Special scheduled reporting interval in unsealed state", category: "COMMUNICATION", type: "number", value: 30, editable: true, unit: "seconds", min: 1 },
  { key: "scheduledUnsealDateTime", label: "Scheduled unseal date and time", category: "COMMUNICATION", type: "datetime", value: "", editable: true },
  { key: "realTimeClockTime", label: "Real-time clock time", category: "COMMUNICATION", type: "readonly", value: "", editable: false },
  { key: "terminalDisplayTimezone", label: "Set the time zone for the terminal display time", category: "COMMUNICATION", type: "select", value: "America/Santiago", editable: true, options: options(["UTC-12", "UTC-8", "UTC-4", "UTC", "UTC+1", "UTC+8", "UTC+12", "America/Santiago"]) },
  { key: "shortConnectionMaxWorkingTime", label: "Activate the maximum allowed working time in the short connection", category: "COMMUNICATION", type: "number", value: 15, editable: true, unit: "minutes", min: 1 },
  { key: "inactivityDuration", label: "Duration of inactivity (unit: minutes)(>=10)", category: "COMMUNICATION", type: "number", value: 10, editable: true, unit: "minutes", min: 10, group: "Automatically modify the reporting interval for a long period of inactivity" },
  { key: "shortConnectionReportingInterval", label: "Short connection reporting interval (unit: minutes)(>=10)", category: "COMMUNICATION", type: "number", value: 10, editable: true, unit: "minutes", min: 10, group: "Automatically modify the reporting interval for a long period of inactivity" },

  { key: "deviceTime", label: "Device time", category: "TIME", type: "readonly", value: "", editable: false },
  { key: "syncDeviceTime", label: "Sync device time", category: "TIME", type: "boolean", value: true, editable: true },
  { key: "timezone", label: "Time zone", category: "TIME", type: "select", value: "America/Santiago", editable: true, options: options(["America/Santiago", "UTC", "UTC+8"]) },
  { key: "daylightSavingEnabled", label: "Daylight saving enabled", category: "TIME", type: "boolean", value: false, editable: true },

  { key: "shackleDisconnectSleepDelay", label: "Lock shackle disconnection delay shutdown and sleep (unit: minutes)", category: "SHACKLE", type: "number", value: 5, editable: true, unit: "minutes", min: 0 },
  { key: "autoSealAfterUnsealTimeout", label: "Auto seal when shackle-open time out after unsealing (unit: minutes)", category: "SHACKLE", type: "number", value: 3, editable: true, unit: "minutes", min: 0 },
  { key: "autoSealWhenShackleClosed", label: "Auto seal when the shackle is closed", category: "SHACKLE", type: "select", value: "Enabled", editable: true, options: enabledDisabled },
  { key: "illegalUnlockAlarm", label: "Illegal unlock alarm", category: "SHACKLE", type: "boolean", value: true, editable: true },
  { key: "shackleStatusReport", label: "Shackle status report", category: "SHACKLE", type: "boolean", value: true, editable: true },

  { key: "clearAndRestoreInstructionSet", label: "Clear and restore instruction set", category: "INSTRUCTION_SET", type: "select", value: "None", editable: true, options: options(["None", "Clear", "Restore", "Clear and restore"]) },
  { key: "networkConnectionStatus", label: "Network connection status", category: "INSTRUCTION_SET", type: "readonly", value: "Normal", editable: false, group: "Network and blind spot storage diagnosis" },
  { key: "basestationCsqValue", label: "Basestation CSQ value", category: "INSTRUCTION_SET", type: "readonly", value: "24", editable: false, group: "Network and blind spot storage diagnosis" },
  { key: "lastOnlineDuration", label: "Last online duration", category: "INSTRUCTION_SET", type: "readonly", value: "00:12:44", editable: false, group: "Network and blind spot storage diagnosis" },
  { key: "externalStorageStatus", label: "External storage status", category: "INSTRUCTION_SET", type: "readonly", value: "Normal", editable: false, group: "Network and blind spot storage diagnosis" },
  { key: "remainingTrackBlindSpots", label: "Number of remaining track blind spots", category: "INSTRUCTION_SET", type: "readonly", value: 0, editable: false, group: "Network and blind spot storage diagnosis" },
  { key: "remainingEventBlindSpots", label: "Number of remaining event blind spots", category: "INSTRUCTION_SET", type: "readonly", value: 0, editable: false, group: "Network and blind spot storage diagnosis" },
  { key: "sensorRealTimeStatus", label: "Sensor real-time status", category: "INSTRUCTION_SET", type: "readonly", value: "Normal", editable: false, group: "Positioning status diagnosis" },
  { key: "realTimePositioningStatus", label: "Real-time positioning status", category: "INSTRUCTION_SET", type: "readonly", value: "Located", editable: false, group: "Positioning status diagnosis" },
  { key: "positioningAntennaRealTimeStatus", label: "Positioning antenna Real-time status", category: "INSTRUCTION_SET", type: "readonly", value: "Normal", editable: false, group: "Positioning status diagnosis" },
  { key: "positioningRealTimePdop", label: "Positioning Real-time PDOP", category: "INSTRUCTION_SET", type: "readonly", value: 1.2, editable: false, group: "Positioning status diagnosis" },
  { key: "realTimeLongitude", label: "Real-time Longitude coordinates", category: "INSTRUCTION_SET", type: "readonly", value: -70.6693, editable: false, group: "Positioning status diagnosis" },
  { key: "realTimeLatitude", label: "Real-time latitude coordinates", category: "INSTRUCTION_SET", type: "readonly", value: -33.4489, editable: false, group: "Positioning status diagnosis" },
  { key: "totalSatellites", label: "Total number of satellites participating in the solution", category: "INSTRUCTION_SET", type: "readonly", value: 12, editable: false, group: "Positioning status diagnosis" },
  { key: "bdSatellites", label: "Number of BD satellites participating in the solution", category: "INSTRUCTION_SET", type: "readonly", value: 4, editable: false, group: "Positioning status diagnosis" },
  { key: "gpsSatellites", label: "Number of GPS satellites participating in the solution", category: "INSTRUCTION_SET", type: "readonly", value: 8, editable: false, group: "Positioning status diagnosis" },
  { key: "strongestSatelliteCnValues", label: "CN values of 10 satellites with strongest signals", category: "INSTRUCTION_SET", type: "readonly", value: "42,41,40,38,37,36,35,35,34,33", editable: false, group: "Positioning status diagnosis" },
  { key: "sealingCheck", label: "Sealing Check", category: "INSTRUCTION_SET", type: "select", value: "None", editable: true, options: options(["None", "Check", "Enabled", "Disabled"]) },
  { key: "agpsAccessAddress", label: "AGPS access address", category: "INSTRUCTION_SET", type: "text", value: "agps.hhdlink.local", editable: true },

  { key: "bluetoothAesPassword", label: "Change Bluetooth AES Password", category: "BLUETOOTH", type: "password", value: "", editable: true, sensitive: true },
  { key: "chipBluetoothMac", label: "Read the chip Bluetooth MAC", category: "BLUETOOTH", type: "readonly", value: "A4:C1:38:2B:00:01", editable: false },
  { key: "bluetoothDeviceName", label: "Change the device's Bluetooth name", category: "BLUETOOTH", type: "text", value: "JPL-G300N", editable: true },
  { key: "bluetoothAppFixedOperationPassword", label: "Bluetooth APP fixed operation password", category: "BLUETOOTH", type: "password", value: "", editable: true, sensitive: true },
  { key: "bluetoothEnabled", label: "Bluetooth enabled", category: "BLUETOOTH", type: "boolean", value: true, editable: true },
  { key: "bluetoothBroadcastInterval", label: "Bluetooth broadcast interval", category: "BLUETOOTH", type: "number", value: 5, editable: true, unit: "seconds", min: 1 },

  { key: "satellitePositioningStatus", label: "Satellite positioning status", category: "LOCATION", type: "select", value: "Enabled", editable: true, options: enabledDisabled },
  { key: "gnssPositioningQuality", label: "GNSS Positioning quality", category: "LOCATION", type: "select", value: "Auto", editable: true, options: options(["High", "Medium", "Low", "Auto"]) },
  { key: "positioningAccuracy", label: "Positioning accuracy", category: "LOCATION", type: "number", value: 10, editable: true, unit: "meters", min: 0 },
  { key: "parkingTimeoutAlarmTime", label: "Parking timeout alarm time (unit: minutes)", category: "LOCATION", type: "number", value: 30, editable: true, unit: "minutes", min: 0 },
  { key: "overspeedAlarmSetting", label: "Overspeed alarm setting (unit: km/h)", category: "LOCATION", type: "number", value: 80, editable: true, unit: "km/h", min: 0, max: 200 },
  { key: "gpsEnabled", label: "GPS enabled", category: "LOCATION", type: "boolean", value: true, editable: true },
  { key: "locationUploadInterval", label: "Location upload interval", category: "LOCATION", type: "number", value: 300, editable: true, unit: "seconds", min: 1 },
  { key: "geofenceEnabled", label: "Geo-fence enabled", category: "LOCATION", type: "boolean", value: false, editable: true },

  { key: "terminalAlarmVoltageValue", label: "Terminal alarm voltage value (unit: 10 millivolts)", category: "POWER_SUPPLY", type: "number", value: 340, editable: true, unit: "10 millivolts", min: 0 },
  { key: "batteryVoltageValue", label: "Battery voltage value (unit: 10 millivolts)", category: "POWER_SUPPLY", type: "readonly", value: 381, editable: false, unit: "10 millivolts" },
  { key: "lowBatteryThreshold", label: "Low battery threshold", category: "POWER_SUPPLY", type: "number", value: 20, editable: true, unit: "%", min: 1, max: 100 },
  { key: "powerSavingMode", label: "Power saving mode", category: "POWER_SUPPLY", type: "select", value: "Normal", editable: true, options: options(["Off", "Normal", "Deep sleep"]) },
  { key: "batteryReportInterval", label: "Battery report interval", category: "POWER_SUPPLY", type: "number", value: 600, editable: true, unit: "seconds", min: 1 },

  { key: "vibrationOr3AxisDisplacementDetection", label: "Vibration or 3-axis displacement detection (unit: seconds)", category: "SENSOR", type: "number", value: 5, editable: true, unit: "seconds", min: 0 },
  { key: "vibrationSensorEnabled", label: "Vibration sensor enabled", category: "SENSOR", type: "boolean", value: true, editable: true },
  { key: "temperatureSensorEnabled", label: "Temperature sensor enabled", category: "SENSOR", type: "boolean", value: true, editable: true },
  { key: "lightSensorEnabled", label: "Light sensor enabled", category: "SENSOR", type: "boolean", value: false, editable: true },
  { key: "tamperAlarmEnabled", label: "Tamper alarm enabled", category: "SENSOR", type: "boolean", value: true, editable: true },

  { key: "icCardAccessPassword", label: "IC card access password", category: "IC_CARD", type: "password", value: "", editable: true, sensitive: true },
  { key: "automaticCardBindingTime", label: "The time allowed for automatic card binding (unit: minutes)", category: "IC_CARD", type: "number", value: 10, editable: true, unit: "minutes", min: 0 },
  { key: "nfcEnabled", label: "NFC/IC card enabled", category: "IC_CARD", type: "boolean", value: true, editable: true },
  { key: "maxCardLimit", label: "Maximum card limit", category: "IC_CARD", type: "number", value: 100, editable: true, min: 1 },
  { key: "cardReadMode", label: "Card read mode", category: "IC_CARD", type: "select", value: "Authorization only", editable: true, options: options(["Read only", "Read and write", "Authorization only"]) },

  { key: "blindSpotSavingRule", label: "Blind spot saving rule", category: "STORAGE", type: "select", value: "Save all", editable: true, options: options(["Disabled", "Save all", "Save only alarm data", "Save only track data"]) },
  { key: "localLogStorageEnabled", label: "Local log storage enabled", category: "STORAGE", type: "boolean", value: true, editable: true },
  { key: "maxOfflineRecords", label: "Maximum offline records", category: "STORAGE", type: "number", value: 1000, editable: true, min: 0 },
  { key: "storageUsage", label: "Storage usage", category: "STORAGE", type: "readonly", value: "18%", editable: false },
  { key: "clearLocalStorage", label: "Clear local storage", category: "STORAGE", type: "select", value: "None", editable: true, options: options(["None", "Clear event records", "Clear track records", "Clear all"]) },

  { key: "currentMcuFirmwareVersion", label: "Current MCU firmware version", category: "OTA", type: "readonly", value: "G300N-MCU-1.0.0", editable: false },
  { key: "terminalUpgradeCommand", label: "Terminal upgrade command", category: "OTA", type: "text", value: "", editable: true },
  { key: "otaEnabled", label: "OTA enabled", category: "OTA", type: "boolean", value: true, editable: true },
  { key: "otaChannel", label: "OTA channel", category: "OTA", type: "select", value: "Internet", editable: true, options: options(["Internet", "Bluetooth App", "Manual"]) },
  { key: "secondaryMcuFirmwareVersion", label: "Secondary MCU firmware version", category: "OTA", type: "readonly", value: "G300N-BLE-1.0.0", editable: false },
  { key: "lastOtaUpdateAt", label: "Last OTA update at", category: "OTA", type: "readonly", value: "", editable: false },
];

export const categories = parameterCategories;

export function groupParameters(fields: ParameterField[]) {
  return fields.reduce<Record<ParameterCategoryKey, ParameterField[]>>((acc, field) => {
    acc[field.category] = [...(acc[field.category] ?? []), field];
    return acc;
  }, {} as Record<ParameterCategoryKey, ParameterField[]>);
}

export function flattenParameters(parameters: Record<string, ParameterField[]>) {
  return Object.values(parameters).flat();
}

export function getDefaultParameters(deviceImei?: string) {
  const now = new Date().toISOString();
  return groupParameters(
    parameterSchema.map((field) => ({
      ...field,
      value:
        field.key === "realTimeClockTime" || field.key === "deviceTime"
          ? now
          : field.key === "lastOtaUpdateAt"
            ? ""
            : field.value ?? (field.type === "password" ? "" : null),
      description: field.key === "terminalUpgradeCommand" ? "TODO: map this field to the vendor OTA command payload." : field.description,
      placeholder: field.type === "password" ? "Enter new value" : field.placeholder,
    })),
  );
}

export function validateParameterUpdates(updates: ParameterUpdateInput[]) {
  const definitions = new Map(parameterSchema.map((field) => [field.key, field]));
  return updates.map((update) => {
    const definition = definitions.get(update.key);
    if (!definition) return { ok: false as const, code: "PARAMETER_NOT_ALLOWED", message: `Parameter ${update.key} is not allowed.` };
    if (!definition.editable || definition.type === "readonly") return { ok: false as const, code: "PARAMETER_NOT_ALLOWED", message: `Parameter ${update.key} is readonly.` };
    const validation = validateValue(definition, update.value);
    if (!validation.ok) return validation;
    return { ok: true as const, definition, update };
  });
}

function validateValue(definition: ParameterDefinition, value: ParameterValue) {
  if (value === null || value === "") {
    if (definition.type === "password") return { ok: true as const };
    return { ok: false as const, code: "INVALID_PARAMETER_VALUE", message: `Parameter ${definition.key} cannot be empty.` };
  }
  if (definition.type === "boolean") return typeof value === "boolean" ? { ok: true as const } : invalid(definition, "must be true or false");
  if (definition.type === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) return invalid(definition, "must be a number");
    if (definition.min !== undefined && value < definition.min) return invalid(definition, `must be greater than or equal to ${definition.min}`);
    if (definition.max !== undefined && value > definition.max) return invalid(definition, `must be less than or equal to ${definition.max}`);
    return { ok: true as const };
  }
  if (definition.type === "select") {
    return definition.options?.some((option) => option.value === value) ? { ok: true as const } : invalid(definition, "must be one of the allowed options");
  }
  if (definition.type === "datetime") return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? { ok: true as const } : invalid(definition, "must be a valid date and time");
  if (definition.type === "password") return typeof value === "string" && value.length >= Number(process.env.PARAMETER_PASSWORD_MIN_LENGTH ?? 4) ? { ok: true as const } : invalid(definition, "password is too short");
  return typeof value === "string" && value.length <= 500 ? { ok: true as const } : invalid(definition, "must be text");
}

function invalid(definition: ParameterDefinition, reason: string) {
  return { ok: false as const, code: "INVALID_PARAMETER_VALUE", message: `Parameter ${definition.key} ${reason}.` };
}

export function sanitizeUpdatesForLog(updates: ParameterUpdateInput[]) {
  const sensitive = new Set(parameterSchema.filter((field) => field.sensitive || field.type === "password").map((field) => field.key));
  return updates.map((update) => ({ key: update.key, value: sensitive.has(update.key) ? "***MASKED***" : update.value }));
}
