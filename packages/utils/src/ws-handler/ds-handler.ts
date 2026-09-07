import type Logger from "@dockstat/logger"
import { t } from "elysia"
import { createWSHandler, type WSTopicHandler } from "./elysia-handler"

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
  // Arbitrary string topics (e.g. widgets/dashboard/<id>) so other
  // subsystems can reuse the shared WS connection without extending
  // this union for every new topic.
  | (string & {})

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
//
// The topic accepts both the well-known typed literals (for Treaty type
// safety on the client) AND arbitrary string topics. Arbitrary strings are
// required so the widgets subsystem can subscribe to dynamic topics like
// `widgets/dashboard/<id>` without needing its own WS endpoint.
const ClientMessageSchema = t.Object({
  topic: t.Union([
    t.Object({ channel: t.String(), id: t.Union([t.String(), t.Number()]) }),
    t.Literal("logs"),
    t.Literal("metrics/containers"),
    t.Literal("metrics/stacks"),
    t.Literal("rss"),
    t.String(),
  ]),
  type: t.Union([t.Literal("subscribe"), t.Literal("unsubscribe"), t.Undefined()]),
})

// ─── Handler ───────────────────────────────────────────────────────────

export interface DSWebSocketHandlerConfig {
  /** Enable authentication for WebSocket connections */
  requireAuth?: boolean
  /** Token verification function */
  verifyToken?: (token: string) => Promise<Record<string, unknown> | null>
  /**
   * Called when a topic gains its first subscriber. Useful for lazily
   * producing an initial snapshot (e.g. evaluating a dashboard data-pipe
   * so a freshly-subscribed client immediately sees static data).
   */
  onFirstSubscriber?: (topic: string) => void
  /** Called when a topic loses its last subscriber. */
  onLastSubscriberLeave?: (topic: string) => void
}

export class WebSocketHandler {
  private logger: Logger
  private inner: WSTopicHandler
  private authConfig?: DSWebSocketHandlerConfig
  /** Server-internal subscribers keyed by topic */
  private internalSubscribers = new Map<string, Set<(data: unknown) => void>>()
  /** Extra onFirstSubscriber callbacks registered after construction */
  private firstSubscriberHooks = new Set<(topic: string) => void>()
  /** Extra onLastSubscriberLeave callbacks registered after construction */
  private lastSubscriberLeaveHooks = new Set<(topic: string) => void>()

  constructor(logger: Logger, config?: DSWebSocketHandlerConfig) {
    this.logger = logger
    this.authConfig = config

    if (config?.onFirstSubscriber) {
      this.firstSubscriberHooks.add(config.onFirstSubscriber)
    }
    if (config?.onLastSubscriberLeave) {
      this.lastSubscriberLeaveHooks.add(config.onLastSubscriberLeave)
    }

    this.inner = createWSHandler(this.logger, {
      bodySchema: ClientMessageSchema,
      onFirstSubscriber: (topic) => this.notifyFirstSubscriber(topic),
      onLastSubscriberLeave: (topic) => this.notifyLastSubscriberLeave(topic),
      prefix: "/ws",
      requireAuth: config?.requireAuth ?? false,
      resolveKey: (topic) => resolveTopicKey(topic as TopicPayload),
      verifyToken: config?.verifyToken,
    })
  }

  /**
   * Register an additional callback fired when a topic gains its first
   * subscriber. Returns an unregister function.
   */
  onFirstSubscriber(cb: (topic: string) => void): () => void {
    this.firstSubscriberHooks.add(cb)
    return () => this.firstSubscriberHooks.delete(cb)
  }

  /**
   * Register an additional callback fired when a topic loses its last
   * subscriber. Returns an unregister function.
   */
  onLastSubscriberLeave(cb: (topic: string) => void): () => void {
    this.lastSubscriberLeaveHooks.add(cb)
    return () => this.lastSubscriberLeaveHooks.delete(cb)
  }

  private notifyFirstSubscriber(topic: string): void {
    for (const cb of this.firstSubscriberHooks) {
      try {
        cb(topic)
      } catch (err) {
        this.logger.warn(`onFirstSubscriber callback failed: ${err}`)
      }
    }
  }

  private notifyLastSubscriberLeave(topic: string): void {
    for (const cb of this.lastSubscriberLeaveHooks) {
      try {
        cb(topic)
      } catch (err) {
        this.logger.warn(`onLastSubscriberLeave callback failed: ${err}`)
      }
    }
  }

  /**
   * Enable or reconfigure authentication.
   * Call before mounting routes.
   */
  configureAuth(config: DSWebSocketHandlerConfig) {
    this.logger.debug("Configuring auth")
    this.authConfig = config
    if (config.onFirstSubscriber) this.firstSubscriberHooks.add(config.onFirstSubscriber)
    if (config.onLastSubscriberLeave)
      this.lastSubscriberLeaveHooks.add(config.onLastSubscriberLeave)
    // Rebuild the inner handler with auth enabled, preserving the
    // first/last subscriber hooks registered earlier.
    this.inner = createWSHandler(this.logger, {
      bodySchema: ClientMessageSchema,
      onFirstSubscriber: (topic) => this.notifyFirstSubscriber(topic),
      onLastSubscriberLeave: (topic) => this.notifyLastSubscriberLeave(topic),
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

  /**
   * All topics available as **data sources** for websocket-source data-pipe
   * nodes. Merges active WS subscriber topics with internal (server-side)
   * subscriber topics, then EXCLUDES dashboard sink topics
   * (`widgets/dashboard/*`) — those are outputs, not sources.
   */
  availableTopics(): string[] {
    const active = this.inner.activeTopics()
    const internal = [...this.internalSubscribers.keys()]
    return [...new Set([...active, ...internal])]
      .filter((topic) => !topic.startsWith("widgets/dashboard/"))
      .sort()
  }

  /** Mount this on your Elysia app: `app.use(handler.getRoutes())` */
  getRoutes() {
    return this.inner.getRoutes()
  }
}
