import Logger from '@dockstat/logger'
import { ElysiaLogger } from '../logger'
import Elysia from 'elysia'

export const logger = new Logger(
	'Docker',
	ElysiaLogger.getParentsForLoggerChaining()
)

const ElysiaDockerInstance = new Elysia({ prefix: '/docker' }).group(
	'/docker-client',
	(EDI) => EDI.get('/all', () => null).post('/create', () => {})
)

export default ElysiaDockerInstance
