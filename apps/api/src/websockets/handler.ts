import Logger from "@dockstat/logger"
import { t } from "elysia"
import { createWSHandler, type WSTopicHandler } from "@dockstat/utils/ws-handler"

// ─── Types ─────────────────────────────────────────────────────────────

interface PluginTopicPayload {
  channel: string
  id: number | string
}

/** Every shape a topic can take in a client message */
type TopicPayload =
  | PluginTopicPayload
  | "logs"
  | "metrics/containers"
  | "metrics/stacks"
  | "rss"

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
export function pluginTopicKey(
  id: number | string,
  channel: string
): string {
  return `plugin/${id}/${channel}`
}

// ─── Elysia body schema (shared) ───────────────────────────────────────

 const ClientMessageSchema =  t.Object({
   type: t.Union([t.Literal("subscribe"), t.Literal("unsubscribe"), t.Undefined()]),
   topic: t.Union([
     t.Object({ channel: t.String(), id: t.Union([t.String(), t.Number()]) }),
     t.Literal("logs"),
     t.Literal("metrics/containers"),
     t.Literal("metrics/stacks"),
     t.Literal("rss")
   ]),
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

  constructor(logger: Logger, config?: DSWebSocketHandlerConfig) {
    this.logger = logger
    this.authConfig = config

    this.inner = createWSHandler(this.logger,{
      prefix: "/ws",
      bodySchema: ClientMessageSchema,
      requireAuth: config?.requireAuth ?? false,
      verifyToken: config?.verifyToken,
      resolveKey: (topic) => resolveTopicKey(topic as TopicPayload),
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
    this.inner = createWSHandler(this.logger,{
      prefix: "/ws",
      bodySchema: ClientMessageSchema,
      requireAuth: config.requireAuth,
      verifyToken: config.verifyToken,
      resolveKey: (topic) => resolveTopicKey(topic as TopicPayload),
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
    return this.inner.send(topic, data)
  }

  /**
   * Publish to a plugin-owned topic.
   * Normalised to `plugin/<id>/<channel>` internally.
   *
   * @example
   * wsHandler.sendToPlugin(5, "events", { containerId: "abc", state: "running" })
   */
  sendToPlugin(
    id: number | string,
    channel: string,
    data: unknown
  ): number {
    return this.inner.send(pluginTopicKey(id, channel), data)
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
