import { treaty } from "@elysiajs/eden"
import { createStaticHandler } from "react-router"
import { DockStatAPI, type DockStatAPIType } from "./api"
import Logger from "@dockstat/logger"
import { logger as BaseLogger } from "./logger"
import { http } from "@dockstat/utils"

const logger = new Logger("Treaty", BaseLogger.getParentsForLoggerChaining())

export const apiHandler = async ({ request }: { request: Request }) => {
	const reqId = request.headers.get("x-dockstatapi-requestid") ?? ""
	logger.debug(
		`Treaty handler forwarding request [${request.method}] ${request.url}`,
		reqId
	)

	return DockStatAPI.handle(request)
}

export const ApiHandler = createStaticHandler(
	[
		{
			path: "*",
			loader: apiHandler,
			action: apiHandler,
		},
	],
	{
		basename: "/api",
	}
)

const originPort: number = Number(Bun.env.DOCKSTAT_BACKEND_PORT || 3000)

export const api = treaty<DockStatAPIType>(`http://localhost:${originPort}`, {
	headers: {
		"x-dockstatapi-requestid": http.requestId.getRequestID(true, true),
	},
}).api

logger.info(`Treaty module ready (origin=http://localhost:${originPort})`)
