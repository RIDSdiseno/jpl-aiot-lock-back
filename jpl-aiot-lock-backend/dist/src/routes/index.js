"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const access_routes_1 = __importDefault(require("../modules/access/access.routes"));
const alerts_routes_1 = __importDefault(require("../modules/alerts/alerts.routes"));
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const commands_routes_1 = __importDefault(require("../modules/commands/commands.routes"));
const companies_routes_1 = __importDefault(require("../modules/companies/companies.routes"));
const events_routes_1 = __importDefault(require("../modules/events/events.routes"));
const gps_routes_1 = __importDefault(require("../modules/gps/gps.routes"));
const locks_routes_1 = __importDefault(require("../modules/locks/locks.routes"));
const users_routes_1 = __importDefault(require("../modules/users/users.routes"));
const router = (0, express_1.Router)();
router.get("/", (_req, res) => {
    res.json({
        ok: true,
        message: "JPL-AIOT-LOCK API",
    });
});
router.use("/auth", auth_routes_1.default);
router.use("/users", users_routes_1.default);
router.use("/companies", companies_routes_1.default);
router.use("/locks", locks_routes_1.default);
router.use(access_routes_1.default);
router.use(commands_routes_1.default);
router.use(events_routes_1.default);
router.use(gps_routes_1.default);
router.use("/alerts", alerts_routes_1.default);
exports.default = router;
