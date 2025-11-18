import Logger from '@dockstat/logger'
import { ElysiaLogger } from '../logger'
import Elysia, { t } from 'elysia'
import DCM from '~/.server/docker'
import { DockerAdapterOptionsSchema } from '@dockstat/typings/schemas'

export const logger = new Logger(
	'Docker',
	ElysiaLogger.getParentsForLoggerChaining()
)

const ElysiaDockerInstance = new Elysia({
	prefix: '/docker',
	detail: { tags: ['Docker'] },
})
	.group('/manager', { detail: { tags: ['Docker Manager'] } }, (EDI) =>
		EDI.get('/pool-stats', () => DCM.getPoolMetrics()).post(
			'/init-all-clients',
			() => {
				const allClients = DCM.getAllClients()
				for (const c of allClients) {
					DCM.init(c.id)
				}
				return
			}
		)
	)
	.group(
		'/docker-client',
		{ detail: { tags: ['Docker Client Management'] } },
		(EDI) =>
			EDI.post(
				'/register',
				({ body }) => DCM.registerClient(body.clientName, body.options),
				{
					body: t.Object({
						clientName: t.String(),
						options: DockerAdapterOptionsSchema,
					}),
				}
			)
				.post('/delete', ({ body }) => DCM.removeClient(body.clientId), {
					body: t.Object({ clientId: t.Number() }),
				})
				.get('/all', () => DCM.getAllClients())
	)
	.group(
		'/hosts',
		{ detail: { tags: ['Docker Host Management'] } },
		(EDIDC) =>
			EDIDC.get('/', async () => {
				const allClients = DCM.getAllClients()
				const allHosts: Record<string, unknown> = {}
				for (const c of allClients) {
					allHosts[c.name] = await DCM.getHosts(c.id)
				}
				return allHosts
			})
				.get(
					'/:id',
					async ({ params }) => await DCM.getHosts(Number(params.id))
				)
				.post(
					'/add',
					async ({ body }) =>
						await DCM.addHost(
							body.clientId,
							body.hostname,
							body.name,
							body.secure,
							body.port
						),
					{
						body: t.Object({
							clientId: t.Number(),
							hostname: t.String(),
							name: t.String(),
							secure: t.Boolean(),
							port: t.Number(),
						}),
					}
				)
	)

export default ElysiaDockerInstance
