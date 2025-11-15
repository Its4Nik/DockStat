import Elysia, { t } from 'elysia'
import PluginHandlerFactory from '@dockstat/plugin-handler'
import { DockStatDB } from '~/.server/db'
import { ElysiaLogger } from '../logger'

export const PluginHandler = new PluginHandlerFactory(
	DockStatDB._sqliteWrapper,
	ElysiaLogger.getParentsForLoggerChaining()
)

const DockStatPluginElysiaInstance = new Elysia({
  name: "DockStatPluginElysiaInstance",
	prefix: '/plugins',
	detail: { tags: ['Plugins'] },
})
	.get('/all', () => PluginHandler.getAll())
	.get('/status', () => PluginHandler.getStatus())
	.post(
		'/install',
		({ body }) =>
			PluginHandler.savePlugin(JSON.parse(body.pluginObject)),
		{
			body: t.Object({ pluginObject: t.String() }),
		}
	)
	.post(
		'/install/url',
		async ({ body }) =>
			await PluginHandler.installFromManifestLink(body),
		{ body: t.String() }
	)
	.post(
		'/activate',
		async ({ body }) => await PluginHandler.loadPlugins(body),
		{
			body: t.Array(t.Number()),
			response: t.Object({
				successes: t.Array(t.Number()),
				errors: t.Array(t.Number()),
			}),
		}
	)
	.post(
		'/delete',
		({ body }) => PluginHandler.deletePlugin(Number(body.pluginId)),
		{
			body: t.Object({
				pluginId: t.String(),
			}),
		}
	)
	.post(
		'/:id/routes/*',
		async ({ request, params }) =>
			PluginHandler.handleRoute(request, params),
		{
			detail: {
				description:
					"This route proxies all Plugin-API requests to the specified Plugin's Elysia Instance",
			},
		}
	)

export default DockStatPluginElysiaInstance
