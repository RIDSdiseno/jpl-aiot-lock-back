"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middlewares/error.middleware");
const routes_1 = __importDefault(require("./routes"));
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({ origin: env_1.env.corsOrigin }));
exports.app.use(express_1.default.json({ limit: "10mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.get("/health", (_req, res) => {
    res.json({
        ok: true,
        service: "JPL-AIOT-LOCK",
        environment: env_1.env.nodeEnv,
    });
});
exports.app.use("/api", routes_1.default);
exports.app.use(error_middleware_1.errorMiddleware);
