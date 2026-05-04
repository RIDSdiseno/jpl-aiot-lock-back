import { CommandType } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import * as commandsService from "./commands.service";

export async function open(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await commandsService.sendLockCommand(
      req.params.lockId,
      req.user!.id,
      CommandType.OPEN,
    );
    return res.status(201).json({ ok: true, data: result });
  } catch (error) {
    return next(error);
  }
}

export async function close(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await commandsService.sendLockCommand(
      req.params.lockId,
      req.user!.id,
      CommandType.CLOSE,
    );
    return res.status(201).json({ ok: true, data: result });
  } catch (error) {
    return next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await commandsService.listLockCommands(req.params.lockId) });
  } catch (error) {
    return next(error);
  }
}
