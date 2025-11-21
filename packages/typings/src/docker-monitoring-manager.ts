import type { StreamMessage } from "./docker-client"

interface BaseConnectionCtx {
	connectionId: string
}

interface MessageConnectionCtx extends BaseConnectionCtx {
	message: StreamMessage
}

export interface DockerStreamManagerProxy {
	"connection:created": (ctx: BaseConnectionCtx) => void
	"connection:closed": (ctx: BaseConnectionCtx) => void

	"message:send": (ctx: MessageConnectionCtx) => void
}
