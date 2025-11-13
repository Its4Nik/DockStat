import Elysia from 'elysia'
import { ElysiaLogger } from './logger'
import { http } from '@dockstat/utils'

const DockStatElysiaHandlers = new Elysia()
	.derive({ as: 'global' }, ({ headers }) => {
		const dockStatRequestId =
			headers['x-dockstatapi-requestid'] ||
			http.requestId.getRequestID(true)
		return {
			dockStatRequestId,
		}
	})
	.onRequest(({ request }) => {
		const reqId =
			request.headers.get('x-dockstatapi-requestid') ||
			http.requestId.getRequestID(true)
		ElysiaLogger.debug(`${request.method} ${request.url}`, reqId)
	})
	.onError({ as: 'global' }, ({ error, code, dockStatRequestId }) => {
		if (code === 'VALIDATION') {
			ElysiaLogger.error(
				`Validation failed: ${error.message}`,
				dockStatRequestId
			)
			return new Response(error.message, { status: 400 })
		}
	})
	.onAfterResponse(
		{ as: 'global' },
		({ request, dockStatRequestId }) => {
			const reqId = dockStatRequestId ?? 'unknown'
			ElysiaLogger.debug(
				`Responded to ${request.method} ${request.url}`,
				reqId
			)
		}
	)

export default DockStatElysiaHandlers
