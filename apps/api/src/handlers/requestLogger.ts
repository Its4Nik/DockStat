import Elysia from "elysia"
import BaseLogger from "../logger"
import { http } from "@dockstat/utils"

const logger = BaseLogger.spawn("Elysia")

const RequestLogger = new Elysia().onRequest(({ request }) => {
  const reqId = http.requestId.getRequestID()

  logger.info(
    `[${request.method}] Request received: ${request.url} ${request.body !== null && `${JSON.stringify({ body: request.body })}`}`,
    reqId
  )

  request.headers.append("x-dockstatapi-reqid", reqId)
})

export default RequestLogger
