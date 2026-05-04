import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, "0.0.0.0", () => {
  console.log(
    `JPL-AIOT-LOCK API running on port ${env.port} in ${env.nodeEnv} mode`,
  );
});
