import type { ReadableStreamDefaultReader } from "node:stream/web"

/**
 * WebSocket-like ready state constants for Docker container attach connections.
 */
const WS_READY_STATE = {
  /** The connection is closed. */
  CLOSED: 3,
  /** The connection is in the process of closing. */
  CLOSING: 2,
  /** The connection is being established. */
  CONNECTING: 0,
  /** The connection is open and ready to communicate. */
  OPEN: 1,
} as const

/**
 * WebSocket-like interface for Docker container attach operations.
 *
 * Uses the Docker attach endpoint with stream wrapping for compatibility
 * with Unix sockets. This provides a familiar WebSocket-like API for
 * reading container output streams (stdout/stderr).
 *
 * **Note:** Currently supports read-only operations (receiving stdout/stderr).
 * Full WebSocket protocol support with bidirectional communication is planned
 * for future versions.
 *
 * @example
 * ```ts
 * const ws = await docker.containers.attachWebSocket("my-container", { stream: true })
 *
 * ws.addEventListener("open", () => {
 *   console.log("Connected to container stream")
 * })
 *
 * ws.addEventListener("message", (event) => {
 *   console.log("Received:", (event as any).data)
 * })
 *
 * ws.addEventListener("close", () => {
 *   console.log("Stream closed")
 * })
 *
 * // To close the connection:
 * ws.close()
 * ```
 */
export class DockerWebSocket {
  /** Ready state: connection is being established. */
  static readonly CONNECTING = WS_READY_STATE.CONNECTING
  /** Ready state: connection is open and ready. */
  static readonly OPEN = WS_READY_STATE.OPEN
  /** Ready state: connection is closing. */
  static readonly CLOSING = WS_READY_STATE.CLOSING
  /** Ready state: connection is closed. */
  static readonly CLOSED = WS_READY_STATE.CLOSED

  private readyStateValue: number = DockerWebSocket.CONNECTING
  private listeners: Map<string, Array<(event: unknown) => void>> = new Map()
  private reader: ReadableStreamDefaultReader | null = null

  /**
   * Register an event listener.
   *
   * Supported event types:
   * - `"open"` — Emitted when the stream connection is established.
   * - `"message"` — Emitted for each data chunk received. Event has a `data` property with the decoded text.
   * - `"error"` — Emitted when an error occurs during reading.
   * - `"close"` — Emitted when the stream is closed.
   *
   * @param type - The event type to listen for.
   * @param listener - The callback function to invoke when the event is emitted.
   */
  addEventListener(type: string, listener: (event: unknown) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)?.push(listener)
  }

  /**
   * Remove a previously registered event listener.
   *
   * @param type - The event type the listener was registered for.
   * @param listener - The exact callback function reference to remove.
   */
  removeEventListener(type: string, listener: (event: unknown) => void): void {
    const typeListeners = this.listeners.get(type)
    if (typeListeners) {
      const index = typeListeners.indexOf(listener)
      if (index > -1) {
        typeListeners.splice(index, 1)
      }
    }
  }

  /**
   * Attach a ReadableStream response to the WebSocket.
   *
   * Starts reading from the response body, transitioning the ready state
   * to `OPEN` and emitting events as data arrives. The stream is read
   * continuously until completion, error, or manual close.
   *
   * If the response has no body, transitions immediately to `CLOSED`
   * and emits an `"error"` event.
   *
   * @param response - The `Response` object from a Docker API fetch call.
   */
  async attach(response: Response): Promise<void> {
    if (!response.body) {
      this.emit("error", new Error("Response has no body"))
      this.readyStateValue = DockerWebSocket.CLOSED
      this.emit("close", {})
      return
    }

    this.reader = response.body.getReader()
    this.readyStateValue = DockerWebSocket.OPEN
    this.emit("open", {})

    try {
      while (this.readyStateValue === DockerWebSocket.OPEN) {
        const { done, value } = await this.reader.read()
        if (done) break

        // Decode the chunk to string
        const text = new TextDecoder().decode(value)
        this.emit("message", { data: text })
      }
    } catch (error) {
      if (this.readyStateValue !== DockerWebSocket.CLOSING) {
        this.emit("error", error)
      }
    } finally {
      this.readyStateValue = DockerWebSocket.CLOSED
      this.emit("close", {})
    }
  }

  /**
   * Close the WebSocket connection.
   *
   * Cancels the underlying stream reader if active, and transitions
   * the ready state to `CLOSED`. If the connection is already closed,
   * this method is a no-op (safe to call multiple times).
   */
  close(): void {
    if (this.readyStateValue === DockerWebSocket.CLOSED) return

    this.readyStateValue = DockerWebSocket.CLOSING

    if (this.reader) {
      this.reader.cancel().catch(() => {})
    }

    this.readyStateValue = DockerWebSocket.CLOSED
    this.emit("close", {})
  }

  /** Returns the `CONNECTING` ready state constant (0). */
  get CONNECTING(): number {
    return DockerWebSocket.CONNECTING
  }

  /** Returns the `OPEN` ready state constant (1). */
  get OPEN(): number {
    return DockerWebSocket.OPEN
  }

  /** Returns the `CLOSING` ready state constant (2). */
  get CLOSING(): number {
    return DockerWebSocket.CLOSING
  }

  /** Returns the `CLOSED` ready state constant (3). */
  get CLOSED(): number {
    return DockerWebSocket.CLOSED
  }

  /**
   * Returns the current ready state of the connection.
   * One of: `CONNECTING` (0), `OPEN` (1), `CLOSING` (2), `CLOSED` (3).
   */
  get readyState(): number {
    return this.readyStateValue
  }

  /**
   * Emit an event to all registered listeners of the given type.
   *
   * @param type - The event type to emit.
   * @param event - The event data to pass to listeners.
   */
  private emit(type: string, event: unknown): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      for (const listener of listeners) {
        listener(event)
      }
    }
  }
}
