import { worker as workerUtils } from "@dockstat/utils"
import type { EventMessage } from "../types"
import type { EVENTS } from "@dockstat/typings"

export const tryBuildFromProxy = (payload: unknown): EventMessage<keyof EVENTS> | null => {
  const message = workerUtils.buildMessage.tryBuildMessageFromProxy(payload)

  if (!message) return null

  return message
}
