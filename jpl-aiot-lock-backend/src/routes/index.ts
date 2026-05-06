import { Router } from "express";
import accessRoutes from "../modules/access/access.routes";
import alertsRoutes from "../modules/alerts/alerts.routes";
import authRoutes from "../modules/auth/auth.routes";
import commandsRoutes from "../modules/commands/commands.routes";
import companiesRoutes from "../modules/companies/companies.routes";
import controlRoutes from "../modules/control/control.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import eventsRoutes from "../modules/events/events.routes";
import gpsRoutes from "../modules/gps/gps.routes";
import locksRoutes from "../modules/locks/locks.routes";
import usersRoutes from "../modules/users/users.routes";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "JPL-AIOT-LOCK API",
  });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/companies", companiesRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/control", controlRoutes);
router.use("/locks", locksRoutes);
router.use(accessRoutes);
router.use(commandsRoutes);
router.use(eventsRoutes);
router.use(gpsRoutes);
router.use("/alerts", alertsRoutes);

export default router;
