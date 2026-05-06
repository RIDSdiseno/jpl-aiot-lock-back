import { NextFunction, Request, Response } from "express";
import { ok } from "../control.mapper";
import { requireControlPermission } from "../shared/control-permissions.service";
import * as service from "./nfc.service";

const userId = (req: Request) => req.user?.id;

export function getCards(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_VIEW");
    res.json(ok(service.getNfcCards(req.params.deviceId)));
  } catch (error) {
    next(error);
  }
}

export function readCards(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_READ");
    res.json(ok(service.readNfcCards(req.params.deviceId, userId(req))));
  } catch (error) {
    next(error);
  }
}

export function addCard(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_ADD");
    res.json(ok(service.addNfcCard(req.params.deviceId, String(req.body.cardNumber ?? ""), req.body.blockNumber, userId(req))));
  } catch (error) {
    next(error);
  }
}

export function syncCards(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_SYNC");
    res.json(ok(service.syncNfcCards(req.params.deviceId, userId(req))));
  } catch (error) {
    next(error);
  }
}

export function clearCards(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_CLEAR");
    res.json(ok(service.clearNfcCards(req.params.deviceId, userId(req))));
  } catch (error) {
    next(error);
  }
}

export function reserveCommand(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_RESERVE_COMMAND");
    res.json(ok(service.reserveNfcCommand(req.params.deviceId, userId(req))));
  } catch (error) {
    next(error);
  }
}
