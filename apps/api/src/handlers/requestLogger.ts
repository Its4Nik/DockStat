import { http } from "@dockstat/utils"
import Elysia from "elysia"
import BaseLogger from "../logger"

const logger = BaseLogger.spawn("Elysia")
const CreateRequestLogger = () => {
  const stateMap = new WeakMap<Request, { startTime: number }>()

  return new Elysia()
    .onRequest(({ request, set }) => {
      stateMap.set(request, { startTime: Date.now() })
      const reqId = http.requestId.getRequestID()

      logger.info(`[${request.method}] Request received from: ${request.url}`, reqId)

      set.headers["x-dockstat-reqid"] = reqId

      logger.info(`Incoming request: [${request.method}] ${request.url} - Status: ${set.status}`)
    })

    .onAfterResponse(({ headers, request }) => {
      const reqId = headers?.["x-dockstatapi-reqid"]

      logger.info(`[${request.method}] Request ${request.url} completed`, reqId)
    })
    .onError(({ request, set, error, code, headers }) => {
      const reqId = headers?.["x-dockstatapi-reqid"]
      const state = stateMap.get(request)
      if (!state) return

      const duration = Date.now() - state.startTime

      logger.error(
        `[${request.method}] ${request.url} - Status: ${set.status} - Duration: ${duration}ms - Code: ${code}`,
        reqId
      )
      logger.error(`Error: ${error.toString()}`)
    })
    .as("global")
}
export default CreateRequestLogger
