"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestLocation = getLatestLocation;
exports.getLocationHistory = getLocationHistory;
exports.createLocation = createLocation;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
function getLatestLocation(lockId) {
    return prisma_1.prisma.lockLocation.findFirst({
        where: { lockId },
        orderBy: { recordedAt: "desc" },
    });
}
function getLocationHistory(lockId) {
    return prisma_1.prisma.lockLocation.findMany({
        where: { lockId },
        orderBy: { recordedAt: "desc" },
        take: 500,
    });
}
async function createLocation(lockId, data) {
    await prisma_1.prisma.lock.findFirstOrThrow({ where: { id: lockId, deletedAt: null } });
    const location = await prisma_1.prisma.lockLocation.create({
        data: {
            lockId,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            speed: data.speed,
            heading: data.heading,
            batteryLevel: data.batteryLevel,
            signalLevel: data.signalLevel,
            source: data.source ?? "iot",
            rawPayload: data.rawPayload === undefined ? undefined : JSON.parse(JSON.stringify(data.rawPayload)),
            recordedAt: data.recordedAt,
        },
    });
    await prisma_1.prisma.lockEvent.create({
        data: {
            lockId,
            type: client_1.LockEventType.GPS_UPDATED,
            latitude: data.latitude,
            longitude: data.longitude,
            batteryLevel: data.batteryLevel,
            signalLevel: data.signalLevel,
            rawPayload: data.rawPayload === undefined ? undefined : JSON.parse(JSON.stringify(data.rawPayload)),
        },
    });
    return location;
}
