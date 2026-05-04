"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMockCommand = sendMockCommand;
async function sendMockCommand(lockId, type) {
    return {
        provider: "mock",
        lockId,
        type,
        success: true,
        message: `Mock command ${type} completed`,
        receivedAt: new Date().toISOString(),
    };
}
