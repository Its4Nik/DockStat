import Logger from "@dockstat/logger"
import Elysia from "elysia"
import { logger as BaseAPILogger } from "../logger";
import { http } from "@dockstat/utils";

const logger = new Logger("Elysia", BaseAPILogger.getParentsForLoggerChaining())

const DockStatElysiaHandlers = new Elysia()
  .onRequest(({ request }) => {
    const reqId = request.headers.get("x-dockstatapi-requestid") || http.requestId.getRequestID()

    logger.debug(`Handling API Call ${request.method} on ${request.url}`, reqId)
  })
  .onAfterHandle(({ request }) => {
    const reqId = request.headers.get("x-dockstatapi-requestid") || ""
    logger.debug(`Responded to API Call ${request.method} on ${request.url}`, reqId)
  })

export default DockStatElysiaHandlers
