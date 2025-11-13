import Logger from '@dockstat/logger'
import { logger as APILogger } from '../logger'

export const ElysiaLogger = new Logger(
	'Elysia',
	APILogger.getParentsForLoggerChaining()
)
