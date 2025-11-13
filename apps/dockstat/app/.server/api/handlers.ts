import Elysia from 'elysia'
import { ElysiaLogger } from './logger'

const DockStatElysiaHandlers = new Elysia()
	.derive({ as: 'global' }, ({ headers }) => {
		const dockStatRequestId = headers['x-dockstatapi-requestid']
		return {
			dockStatRequestId,
		}
	})
	.onRequest(({ request }) => {
		const reqId =
			request.headers.get('x-dockstatapi-requestid') ?? 'unknown'
		ElysiaLogger.debug(`${request.method} ${request.url}`, reqId)
	})
	.onError({ as: 'global' }, ({ error, code }) => {
		if (code === 'VALIDATION') {
			ElysiaLogger.error(`Validation failed: ${error.message}`)
			return new Response(error.message, { status: 400 })
		}
	})
	.onAfterResponse({ as: 'global' }, ({ request }) => {
		const reqId =
			request.headers.get('x-dockstatapi-requestid') ?? 'unknown'
		ElysiaLogger.debug(
			`Responded to ${request.method} ${request.url}`,
			reqId
		)
	})

export default DockStatElysiaHandlers
