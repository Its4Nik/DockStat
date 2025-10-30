import Logger from "@dockstat/logger";
import Elysia from "elysia";
import { logger as BaseAPILogger } from "../logger";
import { http } from "@dockstat/utils";

export const Elogger = new Logger(
  "Elysia",
  BaseAPILogger.getParentsForLoggerChaining(),
);

const DockStatElysiaHandlers = new Elysia()
  .onRequest(({ request }) => {
    const header = request.headers.get("x-dockstatapi-requestid") || http.requestId.getRequestID()

    const reqId =
      header === "treaty" ? http.requestId.getRequestID(false, true) : header

    Elogger.debug(
      `Handling API Call ${request.method} on ${request.url}`,
      reqId,
    );
  })
  .onAfterResponse(({ request }) => {
    const reqId = request.headers.get("x-dockstatapi-requestid") || "";
    Elogger.debug(
      `Responded to API Call ${request.method} on ${request.url}`,
      reqId,
    );
  });

export default DockStatElysiaHandlers;
