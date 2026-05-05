import { NextFunction, Request, Response } from "express";
import * as commands from "./device-command.service";
import * as locations from "./device-location.service";
import * as statusService from "./device-status.service";
import * as monitoring from "./monitoring.service";
import { auditMonitoringAction } from "./monitoring-audit.service";

export async function listDevices(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("[MONITORING] GET /devices");
    const devices = await monitoring.getDevices(req.user ?? {}, req.query.status as string | undefined, req.query.q as string | undefined);
    res.json({ ok: true, devices });
  } catch (error) {
    next(error);
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const devices = await monitoring.getDevices(req.user ?? {});
    const summary = {
      total: devices.length,
      online: devices.filter((device) => device.status === "online").length,
      offline: devices.filter((device) => device.status === "offline").length,
      sleep: 0,
      lostSignal: 0,
      unknown: 0,
      alarm: devices.filter((device) => device.status === "alarm").length,
    };
    res.json({ ok: true, summary });
  } catch (error) {
    next(error);
  }
}

export async function getCompaniesTree(req: Request, res: Response, next: NextFunction) {
  try {
    const devices = await monitoring.getDevices(req.user ?? {});
    const companies = Object.values(
      devices.reduce<Record<string, {
        id: string;
        name: string;
        totalDevices: number;
        online: number;
        offline: number;
        sleep: number;
        alarm: number;
        devices: Array<{
          id: string;
          name: string;
          internalCode: string;
          type: "SMART_LOCK";
          connectionStatus: string;
          batteryLevel: number;
          signalLevel: number;
          hasLocation: boolean;
        }>;
      }>>((acc, device) => {
        const company = acc[device.companyId] ?? {
          id: device.companyId,
          name: device.companyName,
          totalDevices: 0,
          online: 0,
          offline: 0,
          sleep: 0,
          alarm: 0,
          devices: [],
        };
        company.totalDevices += 1;
        if (device.status === "online") company.online += 1;
        if (device.status === "offline") company.offline += 1;
        if (device.status === "alarm") company.alarm += 1;
        company.devices.push({
          id: device.id,
          name: device.name,
          internalCode: device.deviceId,
          type: "SMART_LOCK",
          connectionStatus: device.connectionStatus,
          batteryLevel: device.battery,
          signalLevel: device.signal,
          hasLocation: true,
        });
        acc[device.companyId] = company;
        return acc;
      }, {}),
    );
    res.json({ ok: true, companies });
  } catch (error) {
    next(error);
  }
}

export async function searchDevices(req: Request, res: Response, next: NextFunction) {
  try {
    const devices = await monitoring.searchDevices(req.user ?? {}, req.query.q as string | undefined);
    res.json({ ok: true, devices });
  } catch (error) {
    next(error);
  }
}

export async function getDeviceStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const device = await statusService.getDeviceStatus(req.params.deviceId);
    res.json({ ok: true, device });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentLocation(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, location: await locations.getCurrentLocation(req.params.deviceId) });
  } catch (error) {
    next(error);
  }
}

export async function getDeviceTracking(req: Request, res: Response, next: NextFunction) {
  try {
    const [device, tracking] = await Promise.all([
      statusService.getDeviceStatus(req.params.deviceId),
      locations.getTrajectory(req.params.deviceId),
    ]);
    res.json({ ok: true, device, tracking });
  } catch (error) {
    next(error);
  }
}

export async function getTrajectory(req: Request, res: Response, next: NextFunction) {
  try {
    await auditMonitoringAction(req.user ?? {}, "TRAJECTORY_VIEW", req.params.deviceId);
    res.json({ ok: true, trajectory: await locations.getTrajectory(req.params.deviceId) });
  } catch (error) {
    next(error);
  }
}

export async function exportTrajectory(req: Request, res: Response, next: NextFunction) {
  try {
    await auditMonitoringAction(req.user ?? {}, "TRAJECTORY_EXPORT", req.params.deviceId);
    res.type("text/csv").send(await locations.exportTrajectory(req.params.deviceId));
  } catch (error) {
    next(error);
  }
}

export async function sendSeal(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, command: await commands.sendDeviceCommand(req.user ?? {}, req.params.deviceId, "seal", req.body) });
  } catch (error) {
    next(error);
  }
}

export async function sendUnseal(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, command: await commands.sendDeviceCommand(req.user ?? {}, req.params.deviceId, "unseal", req.body) });
  } catch (error) {
    next(error);
  }
}

export async function sendAdvance(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, command: await commands.sendDeviceCommand(req.user ?? {}, req.params.deviceId, "advance", req.body) });
  } catch (error) {
    next(error);
  }
}

export async function getParameters(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, parameters: await commands.getParameters(req.user ?? {}, req.params.deviceId) });
  } catch (error) {
    next(error);
  }
}

export async function readParameters(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, parameters: await commands.readParameters(req.user ?? {}, req.params.deviceId) });
  } catch (error) {
    next(error);
  }
}

export async function updateParameters(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, parameters: await commands.updateParameters(req.user ?? {}, req.params.deviceId, req.body) });
  } catch (error) {
    next(error);
  }
}

export async function getDynamicPassword(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, dynamicPassword: await commands.getDynamicPassword(req.user ?? {}, req.params.deviceId) });
  } catch (error) {
    next(error);
  }
}

export async function getNfcCards(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, cards: await commands.getNfcCards(req.user ?? {}, req.params.deviceId) });
  } catch (error) {
    next(error);
  }
}

export async function readNfcCards(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, cards: await commands.readNfcCards(req.user ?? {}, req.params.deviceId) });
  } catch (error) {
    next(error);
  }
}

export async function addNfcCard(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json({ ok: true, card: await commands.addNfcCard(req.user ?? {}, req.params.deviceId, req.body) });
  } catch (error) {
    next(error);
  }
}

export async function syncNfcCards(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, cards: await commands.syncNfcCards(req.user ?? {}, req.params.deviceId) });
  } catch (error) {
    next(error);
  }
}

export async function deleteNfcCards(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, cards: await commands.deleteNfcCards(req.user ?? {}, req.params.deviceId, req.body?.cardIds ?? []) });
  } catch (error) {
    next(error);
  }
}

export async function listGeofences(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("[MONITORING] GET /geofences");
    res.json({ ok: true, geofences: await monitoring.getGeofences(req.user ?? {}, req.query.q as string | undefined) });
  } catch (error) {
    next(error);
  }
}

export async function searchGeofences(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, geofences: await monitoring.getGeofences(req.user ?? {}, req.query.q as string | undefined) });
  } catch (error) {
    next(error);
  }
}

export async function getDeviceGeofences(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ ok: true, geofences: await monitoring.getDeviceGeofences(req.user ?? {}, req.params.deviceId) });
  } catch (error) {
    next(error);
  }
}

export async function syncDeviceGeofence(req: Request, res: Response, next: NextFunction) {
  try {
    await auditMonitoringAction(req.user ?? {}, "FENCE_SYNC", req.params.deviceId, { geofenceId: req.params.geofenceId });
    res.json({ ok: true, sync: await monitoring.syncDeviceGeofence(req.user ?? {}, req.params.deviceId, req.params.geofenceId) });
  } catch (error) {
    next(error);
  }
}
