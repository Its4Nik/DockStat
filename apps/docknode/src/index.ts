import Logger from "@dockstat/logger";

const dockNodeLogger = new Logger("DockNode", []);
export const dockNodeLoggerParents: string[] = dockNodeLogger.getParents();

import { openapi } from "@elysiajs/openapi";
import { logger } from "@tqman/nice-logger";
import Elysia from "elysia";
import { authPlugin } from "./handlers/auth/elysia-adapter";
import { DockStackHandler } from "./handlers/dockstack";

new Elysia({ prefix: "/api" })
  .onBeforeHandle({ set }) {}
  .use(
    openapi({
      path: "/docs",
      provider: "scalar",
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
  .get("/deimudda", () => "sex", {
    requireAuth: true,
  })
  .listen(4000);

dockNodeLogger.info("Server listening on http://localhost:4000");
