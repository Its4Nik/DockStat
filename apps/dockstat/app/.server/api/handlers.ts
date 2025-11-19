import Elysia, { type ParseError, type ValidationError } from 'elysia'
import { ElysiaLogger } from './logger'
import { http } from '@dockstat/utils'

let requestCount = 0

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
		requestCount++
		const reqId =
			request.headers.get('x-dockstatapi-requestid') ||
			http.requestId.getRequestID(true)
		ElysiaLogger.debug(
			`${request.method} (Request Nr: ${requestCount}) ${request.url}`,
			reqId
		)
	})
	.onError({ as: 'global' }, ({ error, code, dockStatRequestId }) => {
		if (code === 'VALIDATION') {
			ElysiaLogger.error(
				`Validation failed: expected=${JSON.stringify(error.expected)} - received=${error.name}`,
				dockStatRequestId
			)
			return new Response(error.message, { status: 400 })
		}
		if (code === 'PARSE') {
			ElysiaLogger.error(
				`Parse failed: ${(error as ParseError).message}`,
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
