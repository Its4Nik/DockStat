/**
 * Bun-native WebSocket topic handler.
 *
 * Drop-in replacement for the Elysia-flavored `WebSocketHandler` that runs on
 * `Bun.serve`'s built-in WebSocket support — no Elysia dependency. It keeps
 * the same wire protocol ({ topic, data, timestamp } envelopes and
 * subscribe/unsubscribe/listTopics client messages) so existing clients work
 * unchanged.
 *
 * @example
 * ```ts
 * import { BunWebSocketHandler } from "@dockstat/utils/ws-handler/bun"
 *
 * const ws = new BunWebSocketHandler(logger, {
 *   requireAuth: true,
 *   verifyToken: async (token) => (await verifyAuthToken(token))?.user ?? null,
 * })
 *
 * Bun.serve({
 *   port: 3000,
 *   fetch: async (request, server) => {
 *     const result = await ws.tryUpgrade(request, server)
 *     if (result === "upgraded") return
 *     if (result instanceof Response) return result
 *     return appHandler(request)
 *   },
 *   websocket: ws.websocket,
 * })
 * ```
 */

import type Logger from "@dockstat/logger"

// ── Topic keys ──────────────────────────────────────────────────────

type TopicPayload = string | { channel: string; id: number | string }

/** Canonical topic key: strings pass through, plugin channels become `plugin/<id>/<channel>`. */
export function resolveTopicKey(topic: TopicPayload): string {
  if (typeof topic === "string") return topic
  return `plugin/${topic.id}/${topic.channel}`
}

/** Build a plugin topic key directly. */
export function pluginTopicKey(id: number | string, channel: string): string {
  return `plugin/${id}/${channel}`
}

// ── Wire types ──────────────────────────────────────────────────────

export interface WSServerEnvelope {
  topic: string
  data: unknown
  timestamp: number
}

export type WSClientMessage =
  | { type: "subscribe"; topic: TopicPayload }
  | { type: "unsubscribe"; topic: TopicPayload }
  | { type?: undefined; topic?: undefined; func: "listTopics" }

export interface BunWSHandlerConfig {
  /** Require authentication before the connection is upgraded. */
  requireAuth?: boolean
  /**
   * Token verifier. Receives the raw token (query param `token` or
   * `Authorization: Bearer` header) and returns the user object or null.
   */
  verifyToken?: (token: string) => Promise<Record<string, unknown> | null>
  /** URL pathnames this handler claims for upgrades. Default: ["/ws"]. */
  paths?: string[]
  /** Fired when a topic gains its first subscriber. */
  onFirstSubscriber?: (topic: string) => void
  /** Fired when a topic loses its last subscriber. */
  onLastSubscriberLeave?: (topic: string) => void
}

interface SocketData {
  user?: Record<string, unknown>
  userId?: string
  subscriptions: Set<string>
}

// ── Handler ─────────────────────────────────────────────────────────

export class BunWebSocketHandler {
  private topicMap = new Map<string, Set<Bun.ServerWebSocket<SocketData>>>()
  private internalSubscribers = new Map<string, Set<(data: unknown) => void>>()
  private firstSubscriberHooks = new Set<(topic: string) => void>()
  private lastSubscriberLeaveHooks = new Set<(topic: string) => void>()
  private paths: string[]

  constructor(
    private logger: Logger,
    private config: BunWSHandlerConfig = {}
  ) {
    this.paths = config.paths ?? ["/ws"]
    if (config.onFirstSubscriber) this.firstSubscriberHooks.add(config.onFirstSubscriber)
    if (config.onLastSubscriberLeave)
      this.lastSubscriberLeaveHooks.add(config.onLastSubscriberLeave)
  }

  // ── Upgrade handling ────────────────────────────────────────────

  /** Whether this handler is responsible for the given request path. */
  handles(request: Request): boolean {
    return this.paths.includes(new URL(request.url).pathname)
  }

  /**
   * Attempt to upgrade a request.
   *
   * - `"pass"`    — not our path, caller should handle the request normally
   * - `"upgraded"`— upgrade succeeded, caller must NOT return a Response
   * - `Response`  — upgrade rejected (e.g. 401), return this to the client
   */
  async tryUpgrade(
    request: Request,
    server: Bun.Server<SocketData>
  ): Promise<"pass" | "upgraded" | Response> {
    if (!this.handles(request)) return "pass"

    let data: SocketData = { subscriptions: new Set() }

    if (this.config.requireAuth) {
      if (!this.config.verifyToken)
        return new Response("No auth verifier configured", { status: 500 })

      const url = new URL(request.url)
      const header = request.headers.get("Authorization")
      const token =
        url.searchParams.get("token") ?? (header?.startsWith("Bearer ") ? header.slice(7) : null)

      if (!token) return new Response("Authentication required", { status: 401 })

      const user = await this.config.verifyToken(token)
      if (!user) return new Response("Invalid token", { status: 401 })

      data = { subscriptions: new Set(), user, userId: user.sub as string | undefined }
    }

    const upgraded = server.upgrade(request, { data })
    if (!upgraded) return new Response("WebSocket upgrade failed", { status: 400 })
    return "upgraded"
  }

  /** Bun.serve `websocket` handlers. */
  readonly websocket = {
    close: (ws: Bun.ServerWebSocket<SocketData>) => this.onClose(ws),
    message: (ws: Bun.ServerWebSocket<SocketData>, message: string | Buffer) =>
      this.onMessage(ws, message),
    open: (ws: Bun.ServerWebSocket<SocketData>) => {
      ws.data.subscriptions = new Set()
      this.logger.debug(`WS client connected (${ws.data.userId ?? "unauthenticated"})`)
    },
  }

  // ── Publishing ──────────────────────────────────────────────────

  /** Publish to a built-in / simple topic. Returns delivered client count. */
  send<T extends TopicPayload>(topic: T, data: unknown): number {
    const key = resolveTopicKey(topic)
    this.notifyInternal(key, data)
    return this.broadcast(key, data)
  }

  /** Publish to a plugin-owned topic (`plugin/<id>/<channel>`). */
  sendToPlugin(id: number | string, channel: string, data: unknown): number {
    const key = pluginTopicKey(id, channel)
    this.notifyInternal(key, data)
    return this.broadcast(key, data)
  }

  private broadcast(key: string, data: unknown): number {
    const bucket = this.topicMap.get(key)
    if (!bucket?.size) return 0

    const envelope: WSServerEnvelope = { data, timestamp: Date.now(), topic: key }
    const payload = JSON.stringify(envelope)

    let sent = 0
    for (const ws of bucket) {
      try {
        ws.send(payload)
        sent++
      } catch {
        // client may have dropped
      }
    }
    return sent
  }

  // ── Internal (server-side) pub/sub ──────────────────────────────

  /** Subscribe server-internal code to a topic. Returns an unsubscribe function. */
  onInternalPublish(topic: string, callback: (data: unknown) => void): () => void {
    if (!this.internalSubscribers.has(topic)) {
      this.internalSubscribers.set(topic, new Set())
    }
    this.internalSubscribers.get(topic)?.add(callback)

    return () => {
      this.internalSubscribers.get(topic)?.delete(callback)
      if (this.internalSubscribers.get(topic)?.size === 0) {
        this.internalSubscribers.delete(topic)
      }
    }
  }

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

  // ── Subscriber hooks ────────────────────────────────────────────

  /** Register an extra first-subscriber callback. Returns an unregister function. */
  onFirstSubscriber(cb: (topic: string) => void): () => void {
    this.firstSubscriberHooks.add(cb)
    return () => this.firstSubscriberHooks.delete(cb)
  }

  /** Register an extra last-subscriber-leave callback. Returns an unregister function. */
  onLastSubscriberLeave(cb: (topic: string) => void): () => void {
    this.lastSubscriberLeaveHooks.add(cb)
    return () => this.lastSubscriberLeaveHooks.delete(cb)
  }

  // ── Introspection ───────────────────────────────────────────────

  subscriberCount(topic: string): number {
    return this.topicMap.get(resolveTopicKey(topic))?.size ?? 0
  }

  activeTopics(): string[] {
    return [...this.topicMap.keys()]
  }

  /**
   * Topics usable as data sources for websocket-source data-pipe nodes.
   * Excludes dashboard sink topics (`widgets/dashboard/*`).
   */
  availableTopics(): string[] {
    const active = this.activeTopics()
    const internal = [...this.internalSubscribers.keys()]
    return [...new Set([...active, ...internal])]
      .filter((topic) => !topic.startsWith("widgets/dashboard/"))
      .sort()
  }

  // ── Socket lifecycle ────────────────────────────────────────────

  private onClose(ws: Bun.ServerWebSocket<SocketData>): void {
    for (const key of ws.data.subscriptions) {
      const bucket = this.topicMap.get(key)
      bucket?.delete(ws)
      if (bucket?.size === 0) {
        this.topicMap.delete(key)
        for (const cb of this.lastSubscriberLeaveHooks) {
          try {
            cb(key)
          } catch (err) {
            this.logger.warn(`onLastSubscriberLeave callback failed: ${err}`)
          }
        }
      }
    }
  }

  private onMessage(ws: Bun.ServerWebSocket<SocketData>, message: string | Buffer): void {
    let msg: WSClientMessage
    try {
      msg = JSON.parse(String(message)) as WSClientMessage
    } catch {
      this.logger.warn("Received malformed WS message")
      return
    }

    if ("func" in msg && msg.func === "listTopics") {
      const envelope: WSServerEnvelope = {
        data: this.activeTopics(),
        timestamp: Date.now(),
        topic: "func",
      }
      ws.send(JSON.stringify(envelope))
      return
    }

    const key = resolveTopicKey(msg.topic as TopicPayload)
    if (msg.type === "subscribe") {
      const wasEmpty = !this.topicMap.has(key)
      if (!this.topicMap.has(key)) this.topicMap.set(key, new Set())
      this.topicMap.get(key)?.add(ws)
      ws.data.subscriptions.add(key)
      if (wasEmpty) {
        for (const cb of this.firstSubscriberHooks) {
          try {
            cb(key)
          } catch (err) {
            this.logger.warn(`onFirstSubscriber callback failed: ${err}`)
          }
        }
      }
    } else if (msg.type === "unsubscribe") {
      this.unsubscribe(ws, key)
    }
  }

  private unsubscribe(ws: Bun.ServerWebSocket<SocketData>, key: string): void {
    const bucket = this.topicMap.get(key)
    bucket?.delete(ws)
    if (bucket?.size === 0) {
      this.topicMap.delete(key)
      for (const cb of this.lastSubscriberLeaveHooks) {
        try {
          cb(key)
        } catch (err) {
          this.logger.warn(`onLastSubscriberLeave callback failed: ${err}`)
        }
      }
    }
    ws.data.subscriptions.delete(key)
  }
}
