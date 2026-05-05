import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

const requiredEnv = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"] as const;

function railwayHint(key: (typeof requiredEnv)[number]) {
  if (key === "DATABASE_URL") {
    return "In Railway: backend service -> Variables -> add DATABASE_URL=${{Postgres.DATABASE_URL}}";
  }

  return `In Railway: backend service -> Variables -> add ${key} with a secure generated value`;
}

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `  -> ${railwayHint(key)}\n` +
        "  -> Generate JWT secrets with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
    );
  }
}

const insecureSecretValues = new Set([
  "change_me",
  "change_me_super_secret",
  "change_me_refresh_secret",
  "secret",
  "jwt_secret",
]);

function assertProductionSecret(key: "JWT_SECRET" | "JWT_REFRESH_SECRET") {
  const value = process.env[key];
  if (!isProduction || !value) {
    return;
  }

  if (value.length < 32 || insecureSecretValues.has(value)) {
    throw new Error(
      `Invalid production secret: ${key}\n` +
        `  -> In Railway: backend service -> Variables -> replace ${key} with a secure generated value\n` +
        "  -> Generate it with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
    );
  }
}

assertProductionSecret("JWT_SECRET");
assertProductionSecret("JWT_REFRESH_SECRET");

if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
  throw new Error(
    "JWT_SECRET and JWT_REFRESH_SECRET must be different values.\n" +
      "  -> In Railway: backend service -> Variables -> generate and set two distinct secrets.",
  );
}

const configuredCorsOrigins = (process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultCorsOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://jplaiotlock.netlify.app",
];

const corsOrigins = Array.from(new Set([...configuredCorsOrigins, ...defaultCorsOrigins]));

export const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL as string,
  corsOrigin: corsOrigins,
  frontendUrl: process.env.FRONTEND_URL,
  publicBaseUrl: process.env.PUBLIC_BASE_URL,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  iotProvider: process.env.IOT_PROVIDER ?? "mock",
};
