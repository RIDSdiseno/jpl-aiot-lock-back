import { flattenParameters, getDefaultParameters, groupParameters } from "./parameter.schema";
import { findParameterDevice } from "./parameter.repository";
import { ParameterError, type ParameterField, type ParameterUpdateInput } from "./parameter.types";

export async function readDeviceParameters(deviceId: string) {
  const device = findParameterDevice(deviceId);
  if (!device) throw new ParameterError("DEVICE_NOT_FOUND", "Device not found", 404);
  if (device.status === "OFFLINE") throw new ParameterError("DEVICE_OFFLINE", "Device is offline", 409);
  if (device.status === "SLEEP") {
    return {
      ok: true as const,
      status: "PENDING" as const,
      commandId: "",
      readAt: new Date().toISOString(),
    };
  }

  // TODO: connect MQTT/API/TCP, map vendor payloads, handle timeouts and correlate ACKs by commandId.
  const parameters = getDefaultParameters(device.imei);
  return {
    ok: true as const,
    status: "SUCCESS" as const,
    commandId: "",
    parameters,
    readAt: new Date().toISOString(),
  };
}

export async function updateDeviceParameters(deviceId: string, currentParameters: Record<string, ParameterField[]>, updates: ParameterUpdateInput[]) {
  const device = findParameterDevice(deviceId);
  if (!device) throw new ParameterError("DEVICE_NOT_FOUND", "Device not found", 404);
  if (device.status === "OFFLINE") throw new ParameterError("DEVICE_OFFLINE", "Device is offline", 409);
  if (device.status === "SLEEP") {
    return {
      ok: true as const,
      status: "PENDING" as const,
      commandId: "",
      readAt: new Date().toISOString(),
    };
  }

  // TODO: publish UPDATE_PARAMETERS through the real IoT gateway and map ACK/timeout.
  const next = flattenParameters(currentParameters).map((field) => {
    const update = updates.find((item) => item.key === field.key);
    return update ? { ...field, value: update.value } : field;
  });

  return {
    ok: true as const,
    status: "SUCCESS" as const,
    commandId: "",
    parameters: groupParameters(next),
    readAt: new Date().toISOString(),
  };
}
