import { ApiHandler } from "~/.server/treaty"
import { Logger } from "@dockstat/logger"
import type { Route } from "./+types/api"

const logger = new Logger("Api", ["RR", "DockStat"])
const queryHandlerLoggger = new Logger("query-handler", logger.getParentsForLoggerChaining())

const getReqId = () => Bun.randomUUIDv7().split('-')[4]

async function query(req: Request, reqId: string) {
  req.headers.set("x-dockstatapi-requestid", reqId)

  queryHandlerLoggger.debug(`Processing request: (${req.method}) ${req.url}`, reqId)
  const apiRes = await ApiHandler.query(req)
  const method = req.method
  if (apiRes instanceof Response) {
    queryHandlerLoggger.info("Valid Response instance received", reqId)
    return apiRes
  }

  const loaderData = apiRes.loaderData[0]

  if (method === "GET") {
    queryHandlerLoggger.info(`Returning loader data: ${JSON.stringify(loaderData).length} chars`, reqId)
    return loaderData
  }

  if (method === "POST") {
    const actionData = apiRes.actionData
    if (actionData) {
      queryHandlerLoggger.info(`Returning action data: ${JSON.stringify(actionData[0]).length} chars`, reqId)
      return actionData[0]
    }
  }

  queryHandlerLoggger.warn(`Unknown API request: ${JSON.stringify(apiRes)}`)
  queryHandlerLoggger.debug('Returning default (loaderData[0])')

  return loaderData
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const reqId = getReqId()
  logger.info(`[GET] Requested Api Route: ${params["*"]}`, reqId)
  return await query(request, reqId)
}

export async function action({ request, params }: Route.ActionArgs) {
  const reqId = getReqId()
  logger.info(`[POST] Requested Api Route: ${params["*"]}`)
  return await query(request, reqId)
}
