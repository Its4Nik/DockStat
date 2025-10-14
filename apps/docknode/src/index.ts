import Logger from "@dockstat/logger";

const dockNodeLogger = new Logger("DockNode", []);
export const dockNodeLoggerParents: string[] = dockNodeLogger.getParents();

import { openapi } from "@elysiajs/openapi";
import { logger } from "@tqman/nice-logger";
import Elysia from "elysia";
import { DockStackHandler } from "./handlers/dockstack";
import { authPlugin } from "./handlers/dockstack/src/handlers/auth";
import { getDefaultAuthKey } from "./handlers/dockstack/src/utils/getDefaultAuthKey";

new Elysia({ prefix: "/api" })
  .use(
    openapi({
      path: "/docs",
      provider: "scalar",
    })
  )
  .use(
    authPlugin({
      headerName: "x-dockstacks-api",
      psk: `dockstat-${getDefaultAuthKey()}`,
      ignoredRoutes: [],
    })
  )
  .use(
    logger({
      mode: "combined", // "live" or "combined" (default: "combined")
      withTimestamp: true, // optional (default: false)
      withBanner: true,
      enabled: true,
    })
  )
  .get("/status", { status: 200, message: "alive" })
  .use(DockStackHandler)
  .listen(4000);

dockNodeLogger.info("Server listening on http://localhost:4000");
