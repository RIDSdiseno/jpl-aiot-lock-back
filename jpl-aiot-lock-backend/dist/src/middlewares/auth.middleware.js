"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../utils/jwt");
function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({ ok: false, message: "Missing access token" });
    }
    const token = authorization.replace("Bearer ", "").trim();
    try {
        req.user = (0, jwt_1.verifyAccessToken)(token);
        return next();
    }
    catch {
        return res.status(401).json({ ok: false, message: "Invalid access token" });
    }
}
