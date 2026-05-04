"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.getById = getById;
exports.create = create;
exports.update = update;
exports.remove = remove;
const usersService = __importStar(require("./users.service"));
async function list(req, res, next) {
    try {
        return res.json({ ok: true, data: await usersService.listUsers() });
    }
    catch (error) {
        return next(error);
    }
}
async function getById(req, res, next) {
    try {
        return res.json({ ok: true, data: await usersService.getUserById(req.params.id) });
    }
    catch (error) {
        return next(error);
    }
}
async function create(req, res, next) {
    try {
        const user = await usersService.createUser(req.body, req.user?.id);
        return res.status(201).json({ ok: true, data: user });
    }
    catch (error) {
        return next(error);
    }
}
async function update(req, res, next) {
    try {
        return res.json({
            ok: true,
            data: await usersService.updateUser(req.params.id, req.body, req.user?.id),
        });
    }
    catch (error) {
        return next(error);
    }
}
async function remove(req, res, next) {
    try {
        return res.json({
            ok: true,
            data: await usersService.deleteUser(req.params.id, req.user?.id),
        });
    }
    catch (error) {
        return next(error);
    }
}
