import type { EVENTS } from "@dockstat/typings"
import type { buildMessageFromProxyRes, ProxyEventMessage } from "@dockstat/typings/types"

/**
 * Builds the normalized event payload shape used by the manager/hooks.
 * This is intentionally a tiny helper so both workers and the manager can share a single shape.
 */
export function buildMessageData<K extends keyof EVENTS>(
  type: K,
  ctx: Parameters<EVENTS[K]>[0],
  additionalCtx?: Parameters<EVENTS[K]>[1]
): buildMessageFromProxyRes<K> {
  return { type, ctx, additionalCtx }
}

type AnyProxyEventMessage = ProxyEventMessage<keyof EVENTS>
type AnyEventMessage = buildMessageFromProxyRes<keyof EVENTS>

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

/**
 * Runtime check for the proxied worker event envelope:
 * { type: "__event__", data: { type: string, ctx: object, additionalCtx?: unknown } }
 *
 * Note: We do not try to validate that `data.type` is a valid keyof EVENTS at runtime,
 * because that mapping is only available at compile-time.
 */
export function isProxyEventMessage(payload: unknown): payload is AnyProxyEventMessage {
  if (!isRecord(payload)) return false
  if (payload.type !== "__event__") return false

  const data = (payload as Record<string, unknown>).data
  if (!isRecord(data)) return false

  if (typeof data.type !== "string") return false
  if (!("ctx" in data)) return false

  // ctx is typically an object, but some events may use primitives; keep this permissive.
  return true
}

/**
 * Best-effort parsing of an unknown payload into a normalized event message.
 * Returns `null` when the payload does not represent a proxied event.
 *
 * This is the preferred API to use from the manager to avoid `as` casting.
 */
export function tryBuildMessageFromProxy(payload: unknown): AnyEventMessage | null {
  if (!isProxyEventMessage(payload)) return null

  // payload.data is now known to exist; still keep access narrow and safe.
  const { type, ctx, additionalCtx } = payload.data as {
    type: keyof EVENTS
    ctx: Parameters<EVENTS[keyof EVENTS]>[0]
    additionalCtx?: Parameters<EVENTS[keyof EVENTS]>[1]
  }

  return buildMessageData(type, ctx, additionalCtx)
}

/**
 * For callers that already have a typed ProxyEventMessage (e.g., inside workers).
 * This is a thin wrapper around `buildMessageData`.
 */
export function buildMessageFromProxy<K extends keyof EVENTS>(
  message: ProxyEventMessage<K>
): buildMessageFromProxyRes<K> {
  return buildMessageData(message.data.type, message.data.ctx, message.data.additionalCtx)
}
