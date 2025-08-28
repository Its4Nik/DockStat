import DockStatDB from '@dockstat/db'
import { createLogger } from '@dockstat/logger'
import ThemeHandler from './themeHandler'

export const DDB = new DockStatDB()

export const serverLogger = createLogger('dockstat-server')

serverLogger.info('Creating DockStatDB')

export const themeHandler = new ThemeHandler(DDB.getDB())
