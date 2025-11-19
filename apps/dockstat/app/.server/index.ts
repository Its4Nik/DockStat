import { DockStatAPI } from './api'
import Logger from '@dockstat/logger'
import { logger as BaseLogger } from './logger'

const logger = new Logger(
	'Server',
	BaseLogger.getParentsForLoggerChaining()
)

const PORT = Number(Bun.env.DOCKSTAT_BACKEND_PORT ?? 3000)

DockStatAPI.listen(PORT)

logger.info(
	`Started Elysia on port ${PORT} with config ${JSON.stringify(DockStatAPI.config)}`
)
