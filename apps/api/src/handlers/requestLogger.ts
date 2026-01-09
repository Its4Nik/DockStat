import { http } from "@dockstat/utils"
import Elysia from "elysia"
import BaseLogger from "../logger"

const logger = BaseLogger.spawn("Elysia")

const RequestLogger = new Elysia()
  .onRequest(({ request }) => {
    const reqId = http.requestId.getRequestID()

    logger.info(`[${request.method}] Request received: ${request.url}`, reqId)

    request.headers.append("x-dockstatapi-reqid", reqId)
  })
  .onAfterResponse(({ headers, request }) => {
    const reqId = headers["x-dockstatapi-reqid"]

    logger.info(`[${request.method}] ${request.url} completed`, reqId)
  })

export default RequestLogger
