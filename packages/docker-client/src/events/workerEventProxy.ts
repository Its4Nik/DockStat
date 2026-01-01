import Logger from "@dockstat/logger"
import type { EVENTS } from "@dockstat/typings"
import type { ProxyEventMessage } from "@dockstat/typings/types"
import { worker } from "@dockstat/utils"

declare var self: Worker

const logger = new Logger("DEP")

export function proxyEvent<K extends keyof EVENTS>(
  eventType: K,
  ctx: Omit<Parameters<EVENTS[K]>[0], "logger">,
  additionalDockerClientCtx?: Parameters<EVENTS[K]>[1]
) {
  logger.info(`Proxying Event (${eventType}) to DCM`)

  if (eventType === "error") {
    const errorCtx = ctx as Error | string
    if (errorCtx instanceof Error) {
      logger.error(
        `${errorCtx.name}: ${errorCtx.message}${errorCtx.stack ? `\n${errorCtx.stack}` : ""}${
          additionalDockerClientCtx
            ? ` - context: ${JSON.stringify(additionalDockerClientCtx)}`
            : ""
        }`
      )
    } else {
      logger.error(
        `${String(errorCtx)}${
          additionalDockerClientCtx
            ? ` - context: ${JSON.stringify(additionalDockerClientCtx)}`
            : ""
        }`
      )
    }
  }

  self.postMessage({
    type: "__event__",
    data: worker.buildMessage.buildMessageData(
      eventType,
      ctx as Parameters<EVENTS[K]>[0],
      additionalDockerClientCtx
    ),
  } satisfies ProxyEventMessage<K>)
}
