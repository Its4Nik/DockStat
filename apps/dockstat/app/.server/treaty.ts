import { treaty } from "@elysiajs/eden";
import { createStaticHandler } from "react-router";
import { DockStatAPI, type DockStatAPIType } from "./api";
import { logger as BaseLogger } from "./logger";
import Logger from "@dockstat/logger";

const logger = new Logger("Treaty", BaseLogger.getParentsForLoggerChaining())

DockStatAPI.listen(3000);

logger.info(`Started Elysia ${JSON.stringify(DockStatAPI.config)}`);

const handler = async ({ request }: { request: Request }) => {
  const reqId = request.headers.get("x-dockstatapi-requestid") || "";
  logger.debug(
    `Handling request [${request.method}] (${request.url}) with DockStatAPI`,
    reqId,
  );
  return DockStatAPI.handle(request);
};

export const ApiHandler = createStaticHandler(
  [
    {
      path: "*",
      loader: handler,
      action: handler,
    },
  ],
  { basename: "/api" },
);

export const api = treaty<DockStatAPIType>(
  typeof window !== "undefined" ? location.origin : "http://localhost:3000",
  {
    headers: {
      "x-dockstatapi-requestid": "treaty",
    },
  },
).api;
