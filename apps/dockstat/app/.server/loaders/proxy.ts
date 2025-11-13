import { http } from "@dockstat/utils";
import { logger as LoaderLogger } from ".";
import Logger from "@dockstat/logger";
import { proxyQuery } from "../proxy";
import type { Route } from "@RR/routes/proxy";

const logger = new Logger("Proxy", LoaderLogger.getParentsForLoggerChaining());

export async function ProxyLoader({ request, params }: Route.LoaderArgs) {
	const reqId = http.requestId.getRequestID(true);
	logger.info(`[GET] Api route: ${params["*"]}`, reqId);
	return proxyQuery(request, reqId);
}
