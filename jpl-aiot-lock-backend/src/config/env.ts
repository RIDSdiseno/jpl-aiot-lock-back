import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `  → In Railway: Service → Variables → add ${key}\n` +
        `  → For DATABASE_URL use the reference: $\{\{Postgres.DATABASE_URL\}\}`,
    );
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL as string,
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((o) => o.trim()),
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  iotProvider: process.env.IOT_PROVIDER ?? "mock",
};
