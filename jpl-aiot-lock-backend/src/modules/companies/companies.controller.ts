import { NextFunction, Request, Response } from "express";
import * as companiesService from "./companies.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: await companiesService.listCompanies() });
  } catch (error) {
    return next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({
      ok: true,
      data: await companiesService.getCompanyById(req.params.id),
    });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await companiesService.createCompany(req.body, req.user?.id);
    return res.status(201).json({ ok: true, data: company });
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({
      ok: true,
      data: await companiesService.updateCompany(req.params.id, req.body, req.user?.id),
    });
  } catch (error) {
    return next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({
      ok: true,
      data: await companiesService.deleteCompany(req.params.id, req.user?.id),
    });
  } catch (error) {
    return next(error);
  }
}
