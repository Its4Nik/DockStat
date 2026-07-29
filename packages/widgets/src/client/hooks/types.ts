import type { DataPayload } from "../types"

/**
 * Options for the useWidgetData hook.
 */
export interface UseWidgetDataOptions {
  /** The dashboard id to subscribe to */
  dashboardId: string
  /** Optional: filter to specific data keys */
  keys?: string[]
  /** Callback when new data arrives */
  onUpdate?: (payloads: DataPayload[]) => void
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean
  /** Reconnect interval in ms (default: 3000) */
  reconnectInterval?: number
}

/**
 * Return type of the useWidgetData hook.
 */
export interface UseWidgetDataReturn {
  /** Current data payloads for the subscribed dashboard (null until first message) */
  data: DataPayload[] | null
  /** Whether the WebSocket connection is open */
  connected: boolean
  /** Manually trigger a data-pipe evaluation via REST */
  evaluate: () => Promise<void>
  /** Unsubscribe and close the connection */
  unsubscribe: () => void
  /** Any error that occurred */
  error: Error | null
}
