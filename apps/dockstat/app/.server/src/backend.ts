import type DockerClient from "@dockstat/docker-client";
import { createLogger } from "@dockstat/logger";
import { openapi } from "@elysiajs/openapi";
import { logger as eLogger } from "@tqman/nice-logger";
import { Elysia } from "elysia";
import { reactRouter } from "elysia-react-router";
import { ElysiaAdapterRoute } from "./routes/adapter";

const logger = createLogger("Elysia");

export const ElysiaInstance = new Elysia({ prefix: "/api" })
  .use(
    eLogger({
      mode: "combined", // "live" or "combined" (default: "combined")
      withTimestamp: true, // optional (default: false)
      withBanner: true,
      enabled: true,
    })
  )
  .use(await reactRouter())
  .use(ElysiaAdapterRoute)
  .listen(4000);

declare module "react-router" {
  interface AppLoadContext {
    dockerAdapters?: Record<string, DockerClient>;
  }
}

logger.info(
  `🦊 ElysiaInstance is running at ${ElysiaInstance.server?.hostname}:${ElysiaInstance.server?.port}`
);
