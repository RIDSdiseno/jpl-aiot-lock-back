"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEvents = listEvents;
exports.listLockEvents = listLockEvents;
const prisma_1 = require("../../config/prisma");
function listEvents() {
    return prisma_1.prisma.lockEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
    });
}
function listLockEvents(lockId) {
    return prisma_1.prisma.lockEvent.findMany({
        where: { lockId },
        orderBy: { createdAt: "desc" },
    });
}
