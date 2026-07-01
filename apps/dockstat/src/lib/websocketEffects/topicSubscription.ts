import { getAuthHeaders } from "../api"

// ─── Types ─────────────────────────────────────────────────────────────

/** Client message sent to subscribe/unsubscribe from topics */
interface ClientMessage {
  type: "subscribe" | "unsubscribe"
  topic: string
}

/** Server message pushed to subscribers */
interface ServerMessage {
  topic: string
  data: unknown
  timestamp: number
}

// ─── Helper ───────────────────────────────────────────────────────────

/**
 * Create a WebSocket subscription to a specific topic.
 *
 * This function handles:
 * - Connecting to the /ws endpoint with authentication
 * - Sending subscribe/unsubscribe messages
 * - Filtering incoming messages by topic
 * - Automatic reconnection on disconnect
 * - Cleanup on unmount
 *
 * @param topic - The topic to subscribe to (e.g., "logs", "metrics/containers")
 * @param onData - Callback function called when data is received for this topic
 * @returns Cleanup function to unsubscribe and close the connection
 */
export function createTopicSubscription<T>(
  topic: string,
  onData: (data: T) => void
): () => void {
  // Get the base API URL and convert to WebSocket protocol
  const baseUrl = import.meta.env.DOCKSTAT_API_PORT || `http://localhost:3030`
  const wsUrl = baseUrl.replace("http://", "ws://").replace("https://", "wss://")

  // Get auth token for WebSocket connection
  const token = localStorage.getItem("auth_token")
  const wsUrlWithAuth = token
    ? `${wsUrl}/ws?token=${encodeURIComponent(token)}`
    : `${wsUrl}/ws`

  let ws: WebSocket | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let isIntentionallyClosed = false
  let isSubscribed = false

  const connect = () => {
    try {
      ws = new WebSocket(wsUrlWithAuth)

      ws.onopen = () => {
        // Send subscribe message
        if (!isSubscribed) {
          const subscribeMessage: ClientMessage = { type: "subscribe", topic }
          ws?.send(JSON.stringify(subscribeMessage))
          isSubscribed = true
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data)

          // Filter messages by topic
          if (message.topic === topic) {
            onData(message.data as T)
          }
        } catch (error) {
          console.error(`Failed to parse WebSocket message for topic "${topic}":`, error)
        }
      }

      ws.onclose = (event) => {
        isSubscribed = false

        if (!isIntentionallyClosed) {
          // Attempt to reconnect after 3 seconds
          reconnectTimeout = setTimeout(() => {
            if (!isIntentionallyClosed) {
              connect()
            }
          }, 3000)
        }
      }

      ws.onerror = (error) => {
        console.error(`WebSocket error for topic "${topic}":`, error)
      }
    } catch (error) {
      console.error(`Failed to create WebSocket connection for topic "${topic}":`, error)
    }
  }

  // Start the connection
  connect()

  // Return cleanup function
  return () => {
    isIntentionallyClosed = true

    // Clear any pending reconnection
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    // Send unsubscribe message if connected
    if (ws && ws.readyState === WebSocket.OPEN && isSubscribed) {
      try {
        const unsubscribeMessage: ClientMessage = { type: "unsubscribe", topic }
        ws.send(JSON.stringify(unsubscribeMessage))
      } catch (error) {
        console.error(`Failed to send unsubscribe message for topic "${topic}":`, error)
      }
    }

    // Close the WebSocket connection
    if (ws) {
      ws.close()
      ws = null
    }
  }
}
