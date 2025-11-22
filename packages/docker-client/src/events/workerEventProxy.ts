import Logger from "@dockstat/logger"
import type { EVENTS } from "@dockstat/typings"

declare var self: Worker

const logger = new Logger("DEM")

export function proxyEvent<K extends keyof EVENTS>(
	eventType: K,
	ctx: Omit<Parameters<EVENTS[K]>[0], "logger">,
	additionalDockerClientCtx?: Parameters<EVENTS[K]>[1]
) {
	logger.info(`Proxying Event (${eventType}) to DCM`)

	self.postMessage({
		type: "__event__",
		data: {
			type: eventType,
			ctx: ctx,
			additionalDockerClientCtx: additionalDockerClientCtx,
		},
	})
}
