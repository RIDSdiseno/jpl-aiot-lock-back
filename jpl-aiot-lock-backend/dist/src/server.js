"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
app_1.app.listen(env_1.env.port, () => {
    console.log(`JPL-AIOT-LOCK API running on port ${env_1.env.port} in ${env_1.env.nodeEnv} mode`);
});
