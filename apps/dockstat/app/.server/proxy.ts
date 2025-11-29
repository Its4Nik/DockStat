import { apiHandler } from "./treaty"
import Logger from "@dockstat/logger"

const logger = new Logger("Proxy", ["RR", "DockStat"])
const queryLogger = new Logger("Query", logger.getParentsForLoggerChaining())

export async function proxyQuery(req: Request, reqId: string) {
	try {
		queryLogger.debug(`Processing (${req.method}) ${req.url}`, reqId)
		const apiReq = req
		apiReq.headers.set("x-dockstatapi-requestid", reqId)
		const apiRes = await apiHandler({
			request: req,
		})

		queryLogger.debug(
			`API Res Headers: ${[...apiRes.headers.entries()]}`,
			reqId
		)
		queryLogger.debug("ApiHandler returned Response", reqId)
		return apiRes
	} catch (err) {
		queryLogger.error(`Proxy error: ${(err as Error).message}`, reqId)
		// return an explicit Response for error cases so React Router sees it
		return new Response(
			JSON.stringify({
				error: "internal_server_error",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		)
	}
}
