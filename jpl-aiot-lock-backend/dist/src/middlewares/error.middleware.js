"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
function errorMiddleware(error, _req, res, _next) {
    console.error(error);
    return res.status(500).json({
        ok: false,
        message: error.message || "Internal server error",
    });
}
