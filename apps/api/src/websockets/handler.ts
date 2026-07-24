import type Logger from "@dockstat/logger"
import { createWSHandler, type WSTopicHandler } from "@dockstat/utils/ws-handler"
import { t } from "elysia"

// ─── Types ─────────────────────────────────────────────────────────────

interface PluginTopicPayload {
  channel: string
  id: number | string
}

/** Every shape a topic can take in a client message */
type TopicPayload = PluginTopicPayload | "logs" | "metrics/containers" | "metrics/stacks" | "rss"

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Turn any topic payload into a canonical string key used as the Map key.
 *
 *   "logs"                    → "logs"
 *   { channel: "events", id: 5 } → "plugin/5/events"
 */
function resolveTopicKey(topic: TopicPayload): string {
  if (typeof topic === "string") return topic
  return `plugin/${topic.id}/${topic.channel}`
}

/** Build a plugin topic key directly (handy on the server side). */
export function pluginTopicKey(id: number | string, channel: string): string {
  return `plugin/${id}/${channel}`
}

// ─── Elysia body schema (shared) ───────────────────────────────────────

const ClientMessageSchema = t.Object({
  topic: t.Union([
    t.Object({ channel: t.String(), id: t.Union([t.String(), t.Number()]) }),
    t.Literal("logs"),
    t.Literal("metrics/containers"),
    t.Literal("metrics/stacks"),
    t.Literal("rss"),
  ]),
  type: t.Union([t.Literal("subscribe"), t.Literal("unsubscribe"), t.Undefined()]),
})

// ─── Handler ───────────────────────────────────────────────────────────

export interface DSWebSocketHandlerConfig {
  /** Enable authentication for WebSocket connections */
  requireAuth?: boolean
  /** Token verification function */
  verifyToken?: (token: string) => Promise<Record<string, unknown> | null>
}

class WebSocketHandler {
  private logger: Logger
  private inner: WSTopicHandler
  private authConfig?: DSWebSocketHandlerConfig
  /** Server-internal subscribers keyed by topic */
  private internalSubscribers = new Map<string, Set<(data: unknown) => void>>()

  constructor(logger: Logger, config?: DSWebSocketHandlerConfig) {
    this.logger = logger
    this.authConfig = config

    this.inner = createWSHandler(this.logger, {
      bodySchema: ClientMessageSchema,
      prefix: "/ws",
      requireAuth: config?.requireAuth ?? false,
      resolveKey: (topic) => resolveTopicKey(topic as TopicPayload),
      verifyToken: config?.verifyToken,
    })
  }

  /**
   * Enable or reconfigure authentication.
   * Call before mounting routes.
   */
  configureAuth(config: DSWebSocketHandlerConfig) {
    this.logger.debug("Configuring auth")
    this.authConfig = config
    // Rebuild the inner handler with auth enabled
    this.inner = createWSHandler(this.logger, {
      bodySchema: ClientMessageSchema,
      prefix: "/ws",
      requireAuth: config.requireAuth,
      resolveKey: (topic) => resolveTopicKey(topic as TopicPayload),
      verifyToken: config.verifyToken,
    })
  }

  // ── Publishing ───────────────────────────────────────────────────

  /**
   * Publish to any built-in / simple topic.
   *
   * @example
   * wsHandler.send("logs", logEntry)
   * wsHandler.send("metrics/containers", containerStats)
   */
  send<T extends TopicPayload>(topic: T, data: unknown): number {
    // Resolve the key so internal subscribers get the same topic string
    const key = typeof topic === "string" ? topic : resolveTopicKey(topic)
    this.notifyInternal(key, data)
    return this.inner.send(topic, data)
  }

  /**
   * Publish to a plugin-owned topic.
   * Normalised to `plugin/<id>/<channel>` internally.
   *
   * @example
   * wsHandler.sendToPlugin(5, "events", { containerId: "abc", state: "running" })
   */
  sendToPlugin(id: number | string, channel: string, data: unknown): number {
    // Also notify internal subscribers
    this.notifyInternal(pluginTopicKey(id, channel), data)
    return this.inner.send(pluginTopicKey(id, channel), data)
  }

  // ── Internal pub/sub (server-side listeners) ───────────────────

  /**
   * Subscribe to a topic from server-internal code.
   *
   * Whenever `send()` or `sendToPlugin()` publishes to the given topic,
   * the callback is invoked with the data — even if no WebSocket clients
   * are subscribed.
   *
   * Returns an unsubscribe function.
   *
   * @example
   * const unsub = handler.onInternalPublish("logs", (entry) => {
   *   console.log("New log:", entry)
   * })
   */
  onInternalPublish(topic: string, callback: (data: unknown) => void): () => void {
    if (!this.internalSubscribers.has(topic)) {
      this.internalSubscribers.set(topic, new Set())
    }
    this.internalSubscribers.get(topic)!.add(callback)
    this.logger.debug(`Internal subscriber added for "${topic}"`)

    return () => {
      this.internalSubscribers.get(topic)?.delete(callback)
      if (this.internalSubscribers.get(topic)?.size === 0) {
        this.internalSubscribers.delete(topic)
      }
      this.logger.debug(`Internal subscriber removed for "${topic}"`)
    }
  }

  /** Notify all internal subscribers for a topic. */
  private notifyInternal(topic: string, data: unknown): void {
    const subs = this.internalSubscribers.get(topic)
    if (!subs) return
    for (const cb of subs) {
      try {
        cb(data)
      } catch {
        // ignore callback errors
      }
    }
  }

  // ── Introspection ────────────────────────────────────────────────

  /** How many clients are subscribed to a given topic? */
  subscriberCount(topic: string): number {
    return this.inner.subscriberCount(topic)
  }

  /** All topic keys that currently have at least one subscriber. */
  activeTopics(): string[] {
    return this.inner.activeTopics()
  }

  /** Mount this on your Elysia app: `app.use(handler.getRoutes())` */
  getRoutes() {
    return this.inner.getRoutes()
  }
}

export default WebSocketHandler
