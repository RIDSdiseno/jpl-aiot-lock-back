import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import apiRoutes from "./routes";
import monitoringRoutes from "./routes/monitoring.routes";

export const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "jpl-aiot-lock-backend",
    status: "running",
  });
});

app.use("/api/monitoring", (req, _res, next) => {
  console.log("[AUTH] bypass monitoring demo route:", req.method, req.originalUrl);
  next();
});

app.use("/api/monitoring", monitoringRoutes);
console.log("[MONITORING] routes mounted at /api/monitoring");

app.use("/api", apiRoutes);

app.use(errorMiddleware);
