import Logger from "@dockstat/logger"
import { ElysiaLogger } from "../logger"
import Elysia from "elysia"
import PageHandler from "../../pages"

const logger = new Logger(
	"Components",
	ElysiaLogger.getParentsForLoggerChaining()
)

const ElysiaComponentHandler = new Elysia({
	prefix: "/components",
	detail: { tags: ["components"] },
})
	.get("/js/:name", ({ params, set, headers, status }) => {
		logger.debug("Setting headers", headers["x-dockstatapi-requestid"])
		set.headers["content-type"] = "text/javascript; charset=utf-8"
		logger.debug("Returning Component JS", headers["x-dockstatapi-requestid"])
		const res = PageHandler.getComponentJS(params.name)
		if (!res) {
			set.status = "Not Found"
			set.headers["content-type"] = "application/json"
			return {
				sucess: false,
				status: status,
				message: "Component not found in the registry",
			}
		}
		return res
	})
	.get("/library", () => PageHandler.getComponentLibrary())

export default ElysiaComponentHandler
