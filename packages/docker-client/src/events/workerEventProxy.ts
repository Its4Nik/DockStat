import Logger from "@dockstat/logger"
import type { DOCKER } from "@dockstat/typings"
import type { DockerStreamManagerProxy } from "@dockstat/typings/types"

declare var self: Worker

const logger = new Logger("DEM")

type events = DOCKER.DockerClientEvents & DockerStreamManagerProxy

export function proxyEvent<K extends keyof events>(
	eventType: K,
	ctx: Omit<Parameters<events[K]>[0], "logger">,
	additionalDockerClientCtx?: Parameters<events[K]>[1]
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
