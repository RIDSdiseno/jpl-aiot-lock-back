import { NextFunction, Request, Response } from "express";
import * as usersService from "./users.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await usersService.listUsers() });
  } catch (error) {
    return next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await usersService.getUserById(req.params.id) });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser(req.body, req.user?.id);
    return res.status(201).json({ ok: true, data: user });
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({
      ok: true,
      data: await usersService.updateUser(req.params.id, req.body, req.user?.id),
    });
  } catch (error) {
    return next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({
      ok: true,
      data: await usersService.deleteUser(req.params.id, req.user?.id),
    });
  } catch (error) {
    return next(error);
  }
}
