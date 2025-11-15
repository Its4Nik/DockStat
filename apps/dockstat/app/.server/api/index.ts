import Elysia from 'elysia'

import DatabaseElysiaInstance from './database'
import DockStatElysiaHandlers from './handlers'
import DockStatElysiaPlugins from './elysiaPlugins'
import PluginElysiaInstance from './plugins'
import ExtensionElysiaInstance from './extensions'
import DockStatMetricsElysiaInstance from './metrics'

export const DockStatAPI = new Elysia({ prefix: '/api', name: "DockStatAPI" })
	.use(DockStatElysiaHandlers)
	.use(DockStatMetricsElysiaInstance)
	.use(DockStatElysiaPlugins)
	.get('/status', () => ({
		message: 'Looking goood',
		status: 200,
	}))
	.use(DatabaseElysiaInstance)
	.use(PluginElysiaInstance)
	.use(ExtensionElysiaInstance)

if (import.meta.main) {
	DockStatAPI.listen(3000, console.log)
	console.log(
		'DockStatAPI is running in dev mode, see the docs: https://localhost:3000/api/docs'
	)
}

export { DatabaseElysiaInstance }

export type DockStatAPIType = typeof DockStatAPI
