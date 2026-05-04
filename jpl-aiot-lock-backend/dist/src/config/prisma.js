"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
exports.prisma = new client_1.PrismaClient({
    log: env_1.env.nodeEnv === "production"
        ? ["error"]
        : ["query", "info", "warn", "error"],
});
