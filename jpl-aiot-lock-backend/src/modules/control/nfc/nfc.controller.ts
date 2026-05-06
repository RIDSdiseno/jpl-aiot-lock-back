import { NextFunction, Request, Response } from "express";
import { ok } from "../control.mapper";
import { requireControlPermission } from "../shared/control-permissions.service";
import * as service from "./nfc.service";

const userId = (req: Request) => req.user?.id;

export function getCards(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_VIEW");
    const block = req.query.block ? `Block ${req.query.block}` : String(req.query.blockNumber ?? "Block 1");
    res.json(ok(service.getNfcCards(req.params.deviceId, block)));
  } catch (error) {
    next(error);
  }
}

export function readCards(req: Request, res: Response, next: NextFunction) {
  try {
    requireControlPermission(req, "CONTROL_NFC_READ");
    const block = req.body.block ? `Block ${req.body.block}` : String(req.body.blockNumber ?? "Block 1");
    res.json(ok(service.readNfcCards(req.params.deviceId, block, userId(req))));
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
    res.json(ok(service.syncNfcCards(req.params.deviceId, userId(req), req.body.cards)));
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
