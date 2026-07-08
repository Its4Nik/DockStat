import Logger from "@dockstat/logger"
import Elysia, { type Context, t } from "elysia"
import type { ElysiaWS } from "elysia/ws"

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

/** Inbound message from a connected client */
interface ClientMessage {
  type: "subscribe" | "unsubscribe"
  topic: TopicPayload
}

/** Outbound message pushed to subscribers */
interface ServerMessage {
  topic: string
  data: unknown
  timestamp: number
}

/** Per-client bookkeeping attached to ws.data */
interface ClientState {
  subscriptions: Set<string>
}

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

const ClientMessageSchema = t.Object({
  type: t.Union([t.Literal("subscribe"), t.Literal("unsubscribe")]),
  topic: t.Union([
    t.Object({ channel: t.String(), id: t.Union([t.String(), t.Number()]) }),
    t.Literal("logs"),
    t.Literal("metrics/containers"),
    t.Literal("metrics/stacks"),
  ]),
})

// ─── Handler ───────────────────────────────────────────────────────────

class WebSocketHandler {
  private logger: Logger

  /** topic-key → set of ws clients currently subscribed */
  private topicMap = new Map<string, Set<ElysiaWS<Context>>>()

  /** reverse index: ws → client state (for fast cleanup on disconnect) */
  private clients = new WeakMap<ElysiaWS<Context>, ClientState>()

  /** the Elysia instance with the single /ws route */
  private routes

  constructor(logger: Logger) {
    this.logger = logger

    this.routes = new Elysia({ prefix: "/ws" }).ws("/", {
      open: (ws) => this.onOpen(ws),
      close: (ws) => this.onClose(ws),
      message: (ws, msg: ClientMessage) => this.onMessage(ws, msg),
      body: ClientMessageSchema,
    })
  }

  // ── WebSocket lifecycle ──────────────────────────────────────────

  private onOpen(ws: ElysiaWS<Context>) {
    this.clients.set(ws, { subscriptions: new Set() })
    this.logger.info("WS client connected")
  }

  private onClose(ws: ElysiaWS<Context>) {
    const state = this.clients.get(ws)
    if (!state) return

    // remove this ws from every topic bucket it was in
    for (const key of state.subscriptions) {
      const bucket = this.topicMap.get(key)
      bucket?.delete(ws)
      if (bucket?.size === 0) this.topicMap.delete(key)
    }

    this.clients.delete(ws)
    this.logger.info("WS client disconnected")
  }

  private onMessage(ws: ElysiaWS<Context>, msg: ClientMessage) {
    const key = resolveTopicKey(msg.topic)

    msg.type === "subscribe"
      ? this.subscribe(ws, key)
      : this.unsubscribe(ws, key)
  }

  // ── Subscription management ──────────────────────────────────────

  private subscribe(ws: ElysiaWS<Context>, key: string) {
    if (!this.topicMap.has(key)) {
      this.topicMap.set(key, new Set())
    }

    this.topicMap.get(key)!.add(ws)
    this.clients.get(ws)!.subscriptions.add(key)

    this.logger.debug(
      `+sub "${key}" → ${this.topicMap.get(key)!.size} subscriber(s)`
    )
  }

  private unsubscribe(ws: ElysiaWS<Context>, key: string) {
    const bucket = this.topicMap.get(key)
    bucket?.delete(ws)
    if (bucket?.size === 0) this.topicMap.delete(key)

    this.clients.get(ws)?.subscriptions.delete(key)

    this.logger.debug(`-unsub "${key}"`)
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
    const topicKey = resolveTopicKey(topic)

    return this.broadcast(topicKey, data)
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
    return this.broadcast(pluginTopicKey(id, channel), data)
  }

  /**
   * Core broadcast.  Returns the number of clients the message was
   * delivered to (0 if nobody is listening).
   */
  private broadcast(key: string, data: unknown): number {
    const bucket = this.topicMap.get(key)
    if (!bucket?.size) return 0

    const msg: ServerMessage = {
      data,
      timestamp: Date.now(),
      topic: key,
    }
    const raw = JSON.stringify(msg)

    let sent = 0
    for (const ws of bucket) {
      try {
        ws.send(raw)
        sent++
      } catch {
        // client may have dropped between the event loop tick and .send()
      }
    }
    return sent
  }

  // ── Introspection ────────────────────────────────────────────────

  /** How many clients are subscribed to a given topic? */
  subscriberCount(topic: string): number {
    return this.topicMap.get(topic)?.size ?? 0
  }

  /** All topic keys that currently have at least one subscriber. */
  activeTopics(): string[] {
    return [...this.topicMap.keys()]
  }

  /** Mount this on your Elysia app: `app.use(handler.getRoutes())` */
  getRoutes() {
    return this.routes
  }
}

export default WebSocketHandler
