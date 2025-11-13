import Logger from "@dockstat/logger";
import Elysia from "elysia";
import { logger as BaseAPILogger } from "../logger";

export const ELogger = new Logger(
	"Elysia",
	BaseAPILogger.getParentsForLoggerChaining(),
);

const DockStatElysiaHandlers = new Elysia()
	.onRequest(({ request }) => {
		const reqId = request.headers.get("x-dockstatapi-requestid") ?? "unknown";
		ELogger.debug(`[${reqId}] ${request.method} ${request.url}`);
	})
	.onError(({ error, code }) => {
		if (code === "VALIDATION") {
			ELogger.error(`Validation failed: ${error.message}`);
			return new Response(error.message, { status: 400 });
		}
	})
	.onAfterResponse(({ request }) => {
		const reqId = request.headers.get("x-dockstatapi-requestid") ?? "unknown";
		ELogger.debug(`[${reqId}] Responded to ${request.method} ${request.url}`);
	});

export default DockStatElysiaHandlers;
