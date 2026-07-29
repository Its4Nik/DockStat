/**
 * Elysia-native WebSocket topic handler.
 *
 * Creates type-safe, Treaty-compatible WebSocket routes with
 * built-in pub/sub topic management.  When the Elysia app's
 * Treaty type is provided, the client gets fully typed
 * WebSocket messages out of the box.
 *
 * Supports optional auth integration via `@dockstat/auth`.
 *
 * @example
 * ```ts
 * import { createWSHandler } from "@dockstat/utils/ws-handler"
 * import { treaty } from "@elysiajs/eden"
 * import type { TreatyType } from "./api"
 *
 * const ws = createWSHandler({
 *   prefix: "/ws/myservice",
 *   bodySchema: t.Object({
 *     type: t.Union([t.Literal("subscribe"), t.Literal("unsubscribe")]),
 *     topic: t.String(),
 *   }),
 *   responseSchema: t.Object({
 *     data: t.Any(),
 *     timestamp: t.Number(),
 *     topic: t.String(),
 *   }),
 * })
 *
 * app.use(ws.getRoutes())
 *
 * // On the client, Treaty gives you full types:
 * const app = treaty<TreatyType>("localhost:3000")
 * const wsClient = app.ws.myservice.subscribe()
 *
 * // Publish from the server
 * ws.send("my-topic", { hello: "world" })
 * ```
 */

import type Logger from "@dockstat/logger"
import Elysia, { t } from "elysia"
import type { ElysiaWS } from "elysia/ws"

// ── Server message envelope ───────────────────────────────────────

export interface WSServerEnvelope {
  topic: string
  data: unknown
  timestamp: number
}

// Internal Functions

type ListWSTopics = string[]

// ── Client message ────────────────────────────────────────────────

export type WSClientMessage<TTopic = string> =
  | {
      type: "subscribe"
      topic: TTopic
    }
  | {
      type: "unsubscribe"
      topic: TTopic
    }
  | {
      type: "func"
      topic: undefined
      func: "listTopics"
    }

// ── Per-client state (stored in a WeakMap, not in ws.data) ──────

interface ClientState {
  subscriptions: Set<string>
  userId?: string
  user?: Record<string, unknown>
}

// ── Configuration ─────────────────────────────────────────────────

export interface WSHandlerConfig {
  /** URL prefix for the WebSocket route (default: "/ws") */
  prefix?: string

  /**
   * Elysia TypeBox schema for inbound client messages.
   * Provide a specific schema for Treaty type-safety on the client.
   *
   * Default: generic subscribe/unsubscribe with string topic.
   */
  bodySchema?: any

  /**
   * Elysia TypeBox schema for outbound server messages.
   * Provide this so Treaty can infer the response type on the client.
   *
   * Default: `{ topic: string, data: any, timestamp: number }`.
   */
  responseSchema?: any

  /**
   * Custom topic resolver.  Receives the raw topic and must
   * return a canonical string key.
   *
   * Default: `String(topic)`
   */
  resolveKey?: (topic: unknown) => string

  /**
   * If true, the WebSocket connection requires authentication.
   * The handler will extract the token from the query parameter `token`
   * or the `Authorization` header and verify it using the provided
   * `verifyToken` function.
   *
   * @default false
   */
  requireAuth?: boolean

  /**
   * Token verification function.  Receives the raw token string
   * and must return the user object (with at least a `sub` field)
   * or null if invalid.
   *
   * For `@dockstat/auth`, wrap `verifyAuthToken` to extract the user:
   * ```ts
   *   verifyToken: async (token) => {
   *     const payload = await verifyAuthToken(token)
   *     return payload?.user ?? null
   *   }
   * ```
   */
  verifyToken?: (token: string) => Promise<Record<string, unknown> | null>

  /**
   * Optional callback when a topic gains its first subscriber.
   */
  onFirstSubscriber?: (topic: string) => void

  /**
   * Optional callback when a topic loses its last subscriber.
   */
  onLastSubscriberLeave?: (topic: string) => void
}

// ── Handler class ──────────────────────────────────────────────────

export class WSTopicHandler {
  private topicMap = new Map<string, Set<ElysiaWS<any>>>()
  private clients = new WeakMap<ElysiaWS<any>, ClientState>()
  private config: WSHandlerConfig
  // IMPORTANT: typed as the inferred return of `buildRoutes()`, NOT `any`.
  // Annotating this as `any` propagates through `.use(handler.getRoutes())`
  // and collapses every downstream route-map in the host app to `{}`/`any`,
  // breaking Eden Treaty's type inference (only `~path` is exposed).
  private routes: ReturnType<WSTopicHandler["buildRoutes"]>
  private logger: Logger

  constructor(baselogger: Logger, config: WSHandlerConfig = {}) {
    this.logger = baselogger.spawn("Topics")
    this.config = config
    this.routes = this.buildRoutes()
  }

  // ── Route building ─────────────────────────────────────────────

  private buildRoutes() {
    const handler = this

    const bodySchema =
      this.config.bodySchema ??
      t.ObjectString(
        t.Object({
          topic: t.String(),
          type: t.Union([t.Literal("subscribe"), t.Literal("unsubscribe")]),
        })
      )

    const responseSchema =
      this.config.responseSchema ??
      t.Object({
        data: t.Any(),
        timestamp: t.Number(),
        topic: t.String(),
      })

    const prefix = this.config.prefix ?? "/ws"

    return new Elysia({ name: "WS-Handler", prefix }).ws("/", {
      body: bodySchema,
      close(ws) {
        handler.onClose(ws)
      },
      message(ws, msg: WSClientMessage) {
        handler.onMessage(ws, msg)
      },
      open: this.config.requireAuth
        ? async (ws) => {
            await handler.onOpenAuthenticated(ws)
          }
        : (ws) => {
            handler.onOpen(ws)
          },
      response: responseSchema,
    })
  }

  private getTopics() {
    const topics = this.topicMap.keys()
    return Array.from(topics)
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  private onOpen(ws: ElysiaWS<any>) {
    this.clients.set(ws, { subscriptions: new Set() })
  }

  private async onOpenAuthenticated(ws: ElysiaWS<any>) {
    this.clients.set(ws, { subscriptions: new Set() })

    if (!this.config.verifyToken) {
      ws.close(1008, "No auth verifier configured")
      this.clients.delete(ws)
      return
    }

    // Extract token from query param or Authorization header
    const query = ws.data.query as Record<string, string> | undefined
    const token =
      query?.token ?? this.extractBearerToken(ws.data.request as Request | undefined) ?? null

    if (!token) {
      ws.close(1008, "Authentication required")
      this.clients.delete(ws)
      return
    }

    const user = await this.config.verifyToken(token)
    if (!user) {
      ws.close(1008, "Invalid token")
      this.clients.delete(ws)
      return
    }

    const state = this.clients.get(ws)
    if (state) {
      state.user = user
      state.userId = user.sub as string | undefined
    }
  }

  private extractBearerToken(request: Request | undefined): string | null {
    if (!request) return null
    const authHeader = request.headers.get("Authorization")
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.slice(7)
    }
    return null
  }

  private onClose(ws: ElysiaWS<any>) {
    const state = this.clients.get(ws)
    if (!state) return

    for (const key of state.subscriptions) {
      const bucket = this.topicMap.get(key)
      bucket?.delete(ws)
      if (bucket?.size === 0) {
        this.topicMap.delete(key)
        this.config.onLastSubscriberLeave?.(key)
      }
    }

    this.clients.delete(ws)
  }

  private onMessage(ws: ElysiaWS<any>, msg: WSClientMessage) {
    const key = this.resolveKey(msg.topic)

    if (msg.type === "subscribe") {
      this.logger.debug(`Client subscribing to: ${msg.topic}`)
      this.subscribe(ws, key)
    } else if (msg.type === "func") {
      this.logger.debug(`Client sent command: ${msg.func}`)
      switch (msg.func) {
        case "listTopics": {
          ws.send(this.buildEnvelope("func", this.getTopics))
        }
      }
    } else {
      this.logger.debug(`Client unsubscribing from: ${msg.topic}`)
      this.unsubscribe(ws, key)
    }
  }

  // ── Subscription ─────────────────────────────────────────────

  private subscribe(ws: ElysiaWS<any>, key: string) {
    const wasEmpty = !this.topicMap.has(key)

    if (!this.topicMap.has(key)) {
      this.topicMap.set(key, new Set())
    }

    this.topicMap.get(key)!.add(ws)
    this.clients.get(ws)?.subscriptions.add(key)

    if (wasEmpty) {
      this.config.onFirstSubscriber?.(key)
    }
    this.logger.info(`Subscribed Client: ${key}`)
  }

  private unsubscribe(ws: ElysiaWS<any>, key: string) {
    const bucket = this.topicMap.get(key)
    bucket?.delete(ws)
    if (bucket?.size === 0) {
      this.topicMap.delete(key)
      this.config.onLastSubscriberLeave?.(key)
    }
    this.clients.get(ws)?.subscriptions.delete(key)
    this.logger.info(`Unsubscribed Client: ${key}`)
  }

  // ── Publishing ────────────────────────────────────────────────

  /**
   * Publish data to all subscribers of a topic.
   * Returns the number of clients the message was delivered to.
   */
  send(topic: unknown, data: unknown): number {
    const key = this.resolveKey(topic)
    return this.broadcast(key, data)
  }

  private buildEnvelope(key: string, data: unknown) {
    const envelope: WSServerEnvelope = {
      data,
      timestamp: Date.now(),
      topic: key,
    }

    return envelope
  }

  private broadcast(key: string, data: unknown): number {
    const bucket = this.topicMap.get(key)
    if (!bucket?.size) return 0

    const envelope = this.buildEnvelope(key, data)

    let sent = 0
    for (const ws of bucket) {
      try {
        ws.send(envelope)
        sent++
      } catch {
        // client may have dropped
      }
    }
    return sent
  }

  // ── Introspection ─────────────────────────────────────────────

  subscriberCount(topic: unknown): number {
    return this.topicMap.get(this.resolveKey(topic))?.size ?? 0
  }

  activeTopics(): string[] {
    return [...this.topicMap.keys()]
  }

  /** Mount this on your Elysia app */
  getRoutes() {
    return this.routes
  }

  // ── Internal ──────────────────────────────────────────────────

  private resolveKey(topic: unknown): string {
    if (this.config.resolveKey) {
      return this.config.resolveKey(topic)
    }
    if (typeof topic === "string") return topic
    return String(topic)
  }

  // --- Internal message functions

  private parseInternalCommand(func: string): ListWSTopics {}
}

// ── Factory ─────────────────────────────────────────────────────────

export function createWSHandler(logger: Logger, config: WSHandlerConfig): WSTopicHandler {
  return new WSTopicHandler(logger, config)
}
