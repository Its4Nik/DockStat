/**
 * React Context-based WebSocket provider for topic subscriptions.
 *
 * Wraps the app in a context that maintains a single WebSocket connection
 * per endpoint and shares topic subscriptions across all components.
 *
 * Reads the auth token from localStorage (same key as `@dockstat/auth`)
 * and passes it as a query parameter or Authorization header when
 * `requireAuth` is enabled.
 *
 * @example
 * ```tsx
 * import { WebSocketProvider, useTopicSubscription } from "@dockstat/utils/react"
 *
 * function App() {
 *   return (
 *     <WebSocketProvider url="/api/v2/ws" requireAuth>
 *       <Dashboard />
 *     </WebSocketProvider>
 *   )
 * }
 *
 * function Dashboard() {
 *   const { data, connected } = useTopicSubscription("dashboard/abc", {
 *     transform: (envelope) => envelope.data.payloads,
 *   })
 * }
 * ```
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { WSServerEnvelope } from "../../ws-handler"

// ── Types ──────────────────────────────────────────────────────────

export interface WebSocketProviderConfig {
  /**
   * WebSocket base URL (e.g. "/api/v2/ws").
   * Protocol (ws/wss) is inferred from window.location.
   */
  url: string

  /**
   * Require authentication for the WebSocket connection.
   * When true, reads the token from localStorage and passes
   * it as a `?token=` query parameter.
   *
   * @default false
   */
  requireAuth?: boolean

  /**
   * localStorage key where the auth token is stored.
   * Should match the key used by `@dockstat/auth`'s AuthProvider.
   *
   * @default "auth_token"
   */
  tokenStorageKey?: string

  /**
   * Auto-reconnect on disconnect.
   *
   * @default true
   */
  autoReconnect?: boolean

  /**
   * Reconnect interval in ms.
   *
   * @default 3000
   */
  reconnectInterval?: number
}

interface TopicSubscription {
  /** Callback for each incoming message */
  onMessage: (envelope: WSServerEnvelope) => void
  /** Ref counter — allows multiple subscribers to the same topic */
  refCount: number
}

interface WebSocketContextValue {
  /** Whether the WebSocket is currently connected */
  connected: boolean
  /** Subscribe to a topic. Returns an unsubscribe function. */
  subscribe: (topic: string, onMessage: (envelope: WSServerEnvelope) => void) => () => void
  /** Latest envelope per topic (for hooks that just want the latest) */
  latest: Map<string, WSServerEnvelope>
  /** Connection error, if any */
  error: Error | null
  /** Manually reconnect */
  reconnect: () => void
}

// ── Context ────────────────────────────────────────────────────────

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

// ── Provider ────────────────────────────────────────────────────────

export function WebSocketProvider({
  children,
  ...config
}: WebSocketProviderConfig & { children: ReactNode }): ReactNode {
  const {
    url,
    requireAuth = false,
    tokenStorageKey = "auth_token",
    autoReconnect = true,
    reconnectInterval = 3000,
  } = config

  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const subscriptionsRef = useRef<Map<string, TopicSubscription>>(new Map())
  const latestRef = useRef<Map<string, WSServerEnvelope>>(new Map())
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingMessagesRef = useRef<Array<{ topic: string; type: "subscribe" | "unsubscribe" }>>([])
  const mountedRef = useRef(true)

  // Keep latestRef in sync with state for consumers
  const [latestVersion, setLatestVersion] = useState(0)
  const latestTrigger = useCallback(() => {
    setLatestVersion((v) => v + 1)
  }, [])

  // ── Resolve full URL ──────────────────────────────────────────

  const resolveUrl = useCallback(() => {
    let fullUrl: string

    if (url.startsWith("ws://") || url.startsWith("wss://")) {
      // Already a WebSocket URL
      fullUrl = url
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      // Convert http(s) URL to ws(s)
      fullUrl = url.replace(/^http/, "ws")
    } else {
      // Relative path — resolve against window.location
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const host = window.location.host
      fullUrl = `${protocol}//${host}${url}`
    }

    // Append auth token if required
    if (requireAuth) {
      const token = localStorage.getItem(tokenStorageKey)
      if (token) {
        const separator = fullUrl.includes("?") ? "&" : "?"
        fullUrl = `${fullUrl}${separator}token=${encodeURIComponent(token)}`
      }
    }

    return fullUrl
  }, [url, requireAuth, tokenStorageKey])

  // ── Send a subscribe/unsubscribe message ─────────────────────

  const sendControlMessage = useCallback(
    (topic: string, type: "subscribe" | "unsubscribe") => {
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ topic, type }))
      } else {
        // Queue for when connection opens
        pendingMessagesRef.current.push({ topic, type })
      }
    },
    []
  )

  // ── Subscribe (public API) ───────────────────────────────────

  const subscribe = useCallback(
    (topic: string, onMessage: (envelope: WSServerEnvelope) => void): (() => void) => {
      const subs = subscriptionsRef.current
      const existing = subs.get(topic)

      if (existing) {
        existing.refCount++
        // Update the callback (latest caller wins)
        existing.onMessage = onMessage
      } else {
        subs.set(topic, { onMessage, refCount: 1 })
        sendControlMessage(topic, "subscribe")
      }

      return () => {
        const sub = subs.get(topic)
        if (!sub) return

        sub.refCount--
        if (sub.refCount <= 0) {
          subs.delete(topic)
          latestRef.current.delete(topic)
          latestTrigger()
          sendControlMessage(topic, "unsubscribe")
        }
      }
    },
    [sendControlMessage, latestTrigger]
  )

  // ── Connect ─────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    const fullUrl = resolveUrl()
    const ws = new WebSocket(fullUrl)
    wsRef.current = ws
    setError(null)

    ws.onopen = () => {
      if (!mountedRef.current) return
      setConnected(true)

      // Flush pending messages
      const pending = pendingMessagesRef.current.splice(0)
      for (const msg of pending) {
        ws.send(JSON.stringify({ topic: msg.topic, type: msg.type }))
      }

      // Re-subscribe all active topics
      for (const [topic] of subscriptionsRef.current) {
        ws.send(JSON.stringify({ topic, type: "subscribe" }))
      }
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return

      try {
        const envelope = JSON.parse(event.data) as WSServerEnvelope
        latestRef.current.set(envelope.topic, envelope)
        latestTrigger()

        // Notify all subscribers for this topic
        // (and a "*" catch-all if anyone subscribed to it)
        const subs = subscriptionsRef.current
        const sub = subs.get(envelope.topic)
        if (sub) {
          sub.onMessage(envelope)
        }
        const catchAll = subs.get("*")
        if (catchAll) {
          catchAll.onMessage(envelope)
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setConnected(false)
      wsRef.current = null

      if (autoReconnect) {
        reconnectTimerRef.current = setTimeout(connect, reconnectInterval)
      }
    }

    ws.onerror = () => {
      if (!mountedRef.current) return
      setError(new Error("WebSocket connection error"))
    }
  }, [resolveUrl, autoReconnect, reconnectInterval])

  // ── Manual reconnect ─────────────────────────────────────────

  const reconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }
    connect()
  }, [connect])

  // ── Lifecycle ────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  // ── Context value ───────────────────────────────────────────

  // Re-create the context value when latestVersion changes so
  // consumers that read `latest` get a fresh Map reference.
  const contextValue = useMemo<WebSocketContextValue>(
    () => ({
      connected,
      error,
      latest: latestRef.current,
      reconnect,
      subscribe,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connected, error, reconnect, subscribe, latestVersion]
  )

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

// ── Hooks ────────────────────────────────────────────────────────

/**
 * Access the WebSocket context.
 * Throws if used outside of a `WebSocketProvider`.
 */
export function useWebSocketContext(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext)
  if (!ctx) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider")
  }
  return ctx
}

/**
 * Subscribe to a topic and receive typed data.
 *
 * @example
 * ```tsx
 * const { data, connected } = useTopicSubscription<MyPayload>("dashboard/abc", {
 *   transform: (envelope) => envelope.data,
 * })
 * ```
 */
export interface UseTopicSubscriptionOptions<TData = unknown> {
  /** Transform the raw envelope into the data shape you need */
  transform?: (envelope: WSServerEnvelope) => TData
  /** Called on every message (in addition to updating `data`) */
  onMessage?: (data: TData, envelope: WSServerEnvelope) => void
}

export interface UseTopicSubscriptionReturn<TData = unknown> {
  /** The latest transformed data for this topic (null until first message) */
  data: TData | null
  /** The raw envelope */
  envelope: WSServerEnvelope | null
  /** Whether the WebSocket is connected */
  connected: boolean
  /** Connection error */
  error: Error | null
  /** Subscribe to additional topics from this hook */
  subscribe: (topic: string, onMessage: (envelope: WSServerEnvelope) => void) => () => void
  /** Unsubscribe from this topic */
  unsubscribe: () => void
}

export function useTopicSubscription<TData = unknown>(
  topic: string,
  options?: UseTopicSubscriptionOptions<TData>
): UseTopicSubscriptionReturn<TData> {
  const { connected, error, latest, subscribe: ctxSubscribe } = useWebSocketContext()
  const [data, setData] = useState<TData | null>(null)
  const [envelope, setEnvelope] = useState<WSServerEnvelope | null>(null)

  const transform = options?.transform
  const onMessage = options?.onMessage

  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    unsubRef.current = ctxSubscribe(topic, (env) => {
      setEnvelope(env)
      if (transform) {
        const transformed = transform(env)
        setData(transformed)
        onMessage?.(transformed, env)
      } else {
        setData(env.data as TData)
        onMessage?.(env.data as TData, env)
      }
    })

    // Initialize with latest data if available
    const existing = latest.get(topic)
    if (existing) {
      setEnvelope(existing)
      if (transform) {
        setData(transform(existing))
      } else {
        setData(existing.data as TData)
      }
    }

    return () => {
      unsubRef.current?.()
      unsubRef.current = null
    }
  }, [topic, ctxSubscribe, latest, transform, onMessage])

  return {
    connected,
    data,
    envelope,
    error,
    subscribe: ctxSubscribe,
    unsubscribe: () => unsubRef.current?.(),
  }
}

/**
 * Subscribe to a catch-all topic ("*") to receive ALL messages.
 */
export function useAllMessages(): {
  data: WSServerEnvelope[]
  connected: boolean
  error: Error | null
} {
  const { connected, error, subscribe: ctxSubscribe } = useWebSocketContext()
  const [data, setData] = useState<WSServerEnvelope[]>([])

  useEffect(() => {
    const unsub = ctxSubscribe("*", (env) => {
      setData((prev) => [...prev, env])
    })

    return unsub
  }, [ctxSubscribe])

  return { connected, data, error }
}
