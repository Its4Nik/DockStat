import Logger from "@dockstat/logger"
import { ElysiaLogger } from "../logger"
import Elysia from "elysia"
import PageHandler from "../../pages"

const _logger = new Logger("Pages", ElysiaLogger.getParentsForLoggerChaining())

const ElysiaPagesHandler = new Elysia({ prefix: "/pages" }).get("/all", () =>
	PageHandler.getPages()
)

export default ElysiaPagesHandler
