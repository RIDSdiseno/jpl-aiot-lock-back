import { CommandType } from "@prisma/client";

export async function sendMockCommand(lockId: string, type: CommandType) {
  return {
    provider: "mock",
    lockId,
    type,
    success: true,
    message: `Mock command ${type} completed`,
    receivedAt: new Date().toISOString(),
  };
}
