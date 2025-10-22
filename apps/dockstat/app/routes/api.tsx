import { ApiHandler } from "~/.server/treaty"
import { Logger } from "@dockstat/logger"
import type { Route } from "./+types/api"

const logger = new Logger("Api", ["RR", "DockStat"])
const queryHandlerLoggger = new Logger("query-handler", logger.getParentsForLoggerChaining())

async function query(req: Request) {
  queryHandlerLoggger.debug(`Processing request: (${req.method}) ${req.url}`)
  const apiRes = await ApiHandler.query(req)
  const method = req.method
  if (apiRes instanceof Response) {
    queryHandlerLoggger.info("Valid Response instance received")
    return apiRes
  }

  const loaderData = apiRes.loaderData[0]

  if (method === "GET") {
    queryHandlerLoggger.info(`Returning loader data: ${JSON.stringify(loaderData).length} chars`)
    return loaderData
  }

  if (method === "POST") {
    const actionData = apiRes.actionData
    if (actionData) {
      queryHandlerLoggger.info(`Returning action data: ${JSON.stringify(actionData[0]).length} chars`)
      return actionData[0]
    }
  }

  queryHandlerLoggger.warn(`Unknown API request: ${JSON.stringify(apiRes)}`)
  queryHandlerLoggger.debug('Returning default (loaderData[0])')

  return loaderData
}

export async function loader({ request, params }: Route.LoaderArgs) {
  logger.info(`[GET] Requested Api Route: ${params["*"]}`)
  return await query(request)
}

export async function action({ request, params }: Route.ActionArgs) {
  logger.info(`[POST] Requested Api Route: ${params["*"]}`)
  return await query(request)
}
