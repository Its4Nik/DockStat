import type { EVENTS } from "@dockstat/typings"
import type {
	buildMessageFromProxyRes,
	ProxyEventMessage,
} from "@dockstat/typings/types"
import WorkerLogger from "./_logger"

export function buildMessageData<K extends keyof EVENTS>(
	type: K,
	ctx: Parameters<EVENTS[K]>[0],
	additionalCtx?: Parameters<EVENTS[K]>[1]
) {
	WorkerLogger.debug(
		`Building message data for type ${type} - ${JSON.stringify(ctx)} - ${JSON.stringify(additionalCtx)}`
	)
	return {
		type,
		ctx,
		additionalCtx,
	}
}

export function buildMessageFromProxy<K extends keyof EVENTS>(
	message: ProxyEventMessage<K>
): buildMessageFromProxyRes<K> {
	return buildMessageData(
		message.data.type,
		message.data.ctx,
		message.data.additionalCtx
	)
}

export type buildMessageFromProxy = typeof buildMessageFromProxy
