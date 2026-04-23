import { http } from "@dockstat/utils"
import Elysia from "elysia"
import BaseLogger from "../logger"

export const stateMap = new WeakMap<Request, { startTime: number; reqId: string }>()

const logger = BaseLogger.spawn("Elysia")
const CreateRequestLogger = () => {
  return new Elysia()
    .onRequest(({ request, set }) => {
      const startTime = Date.now()
      const reqId = http.requestId.getRequestID()
      stateMap.set(request, { reqId, startTime })

      logger.info(`[${request.method}] Request received ${request.url}`, reqId)
    })

    .onAfterResponse(({ request }) => {
      const state = stateMap.get(request)

      logger.info(`[${request.method}] Request ${request.url} completed`, state?.reqId)
    })
    .onError(({ request, set, error, code }) => {
      const state = stateMap.get(request)
      if (!state) return

      const duration = Date.now() - state.startTime

      logger.error(
        `[${request.method}] ${request.url} - Status: ${set.status} - Duration: ${duration}ms - Code: ${code}`,
        state.reqId
      )
      logger.error(`Error: ${error.toString()}`)
    })
    .as("global")
}
export default CreateRequestLogger
