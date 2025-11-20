import { http } from "@dockstat/utils"
import { logger as ActionLogger } from "."
import Logger from "@dockstat/logger"
import { proxyQuery } from "../proxy"
import type { Route } from "@RR/routes/proxy"

const logger = new Logger("Proxy", ActionLogger.getParentsForLoggerChaining())

export async function ProxyAction({ request, params }: Route.ActionArgs) {
	const reqId = http.requestId.getRequestID(true)
	logger.info(`[POST] Api route: ${params["*"]}`, reqId)
	return proxyQuery(request, reqId)
}
