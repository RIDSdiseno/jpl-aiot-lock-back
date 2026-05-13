import { NextFunction, Request, Response } from "express";
import { parseReportQuery } from "./report.schema";
import * as reportService from "./report.service";
import { lockUnlockToCsv } from "./reports/reportExport.service";

export async function options(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ ok: true, data: reportService.getReportOptions() });
  } catch (error) {
    return next(error);
  }
}

export async function listLockUnlock(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reportService.listLockUnlock(parseReportQuery(req.query));
    return res.json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

export async function exportLockUnlock(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("[REPORT][EXPORT_REQUEST]", { reportType: "lock-unlock" });
    const result = await reportService.listLockUnlock({ ...parseReportQuery(req.query), page: 1, limit: 100 });
    console.log("[REPORT][EXPORT_SUCCESS]", { reportType: "lock-unlock", count: result.data.length });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"lock-unlock-report.csv\"");
    return res.send(lockUnlockToCsv(result.data));
  } catch (error) {
    console.log("[REPORT][EXPORT_FAILED]", { reportType: "lock-unlock" });
    return next(error);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.params.reportType !== "lock-unlock") {
      return res.status(404).json({ ok: false, message: "Report type not found" });
    }
    const item = await reportService.getLockUnlockDetail(req.params.id);
    return res.json({ ok: true, data: item });
  } catch (error) {
    return next(error);
  }
}
