import type { EVENTS } from "."

export interface ProxyEventMessage<K extends keyof EVENTS> {
  type: "__event__"
  data: {
    type: K
    ctx: Parameters<EVENTS[K]>[0]
    additionalCtx?: Parameters<EVENTS[K]>[1]
  }
}
export interface buildMessageFromProxyRes<K extends keyof EVENTS> {
  type: K
  ctx: Parameters<EVENTS[K]>[0]
  additionalCtx?: Parameters<EVENTS[K]>[1]
}
