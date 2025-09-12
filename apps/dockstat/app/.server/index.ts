import DockStatDB from '@dockstat/db'
import { createLogger } from '@dockstat/logger'

export const DDB = new DockStatDB()

export const serverLogger = createLogger('dockstat-server')

serverLogger.info('Creating DockStatDB')
