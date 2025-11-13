import { ApiHandler } from "./treaty";
import Logger from "@dockstat/logger";

const logger = new Logger("Proxy", ["RR", "DockStat"]);
const queryLogger = new Logger("Query", logger.getParentsForLoggerChaining());

/**
 * Build a new Request that preserves the body and headers while injecting reqId.
 * This avoids mutating the original Request.headers (some runtimes don't like that).
 */
async function buildForwardRequest(original: Request, reqId: string) {
	const headers = new Headers(original.headers);
	headers.set("x-dockstatapi-requestid", reqId);

	let body: BodyInit | undefined;
	if (original.method !== "GET" && original.method !== "HEAD") {
		const buf = await original.clone().arrayBuffer();
		body = Buffer.from(buf);
	}

	return new Request(original.url, {
		method: original.method,
		headers,
		body,
	});
}

/**
 * Proxy a React Router loader/action request to the ApiHandler.query(...)
 * Returns either a Response (pass-through) or plain data object expected by RR.
 */
export async function proxyQuery(req: Request, reqId: string) {
	try {
		queryLogger.debug(`Processing (${req.method}) ${req.url}`, reqId);

		const forwarded = await buildForwardRequest(req, reqId);
		const apiRes = await ApiHandler.query(forwarded);

		if (apiRes instanceof Response) {
			queryLogger.info("ApiHandler returned Response", reqId);
			return apiRes;
		}

		const loaderData = apiRes.loaderData?.[0];
		const actionData = apiRes.actionData?.[0];

		if (req.method === "GET") {
			queryLogger.info(
				`Returning loaderData (size=${JSON.stringify(loaderData || "").length})`,
				reqId,
			);
			return loaderData;
		}

		// POST/PUT/PATCH expectations — return action data if present
		if (req.method !== "GET") {
			queryLogger.info(
				`Returning actionData ${actionData ? `(size=${JSON.stringify(actionData).length})` : "(empty)"}`,
				reqId,
			);
			return actionData ?? loaderData;
		}

		// fallback
		queryLogger.warn("Falling back to loaderData", reqId);
		return loaderData;
	} catch (err) {
		queryLogger.error(`Proxy error: ${(err as Error).message}`, reqId);
		// return an explicit Response for error cases so React Router sees it
		return new Response(JSON.stringify({ error: "internal_server_error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
