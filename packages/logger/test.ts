import { createLogger } from "."

const logger = createLogger("test")
logger.info("Info message")
logger.warn("Warning message")
logger.error("Error message")
logger.debug("Debug message")
