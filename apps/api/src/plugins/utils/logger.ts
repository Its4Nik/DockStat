import Logger from "@dockstat/logger"
import { ElysiaLogger } from "../../logger"

export const logger = new Logger(
	"Plugins",
	ElysiaLogger.getParentsForLoggerChaining()
)
