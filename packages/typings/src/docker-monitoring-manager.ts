import type { StreamMessage } from "./docker-client"

export interface BaseConnectionCtx {
  connectionId: string
}

export interface MessageConnectionCtx extends BaseConnectionCtx {
  message: StreamMessage
}

export interface DockerStreamManagerProxy {
  "connection:created": (ctx: BaseConnectionCtx) => void
  "connection:closed": (ctx: BaseConnectionCtx) => void

  "message:send": (ctx: MessageConnectionCtx) => void
}
