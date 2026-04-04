import type { ReadableStreamDefaultReader } from "node:stream/web"

/**
 * WebSocket-like interface for Docker container attach
 * Uses the attach endpoint with stream wrapping for compatibility with Unix sockets
 *
 * @note Currently supports read-only operations (receiving stdout/stderr). Full WebSocket
 * protocol support with bidirectional communication is planned for future versions.
 */
export class DockerWebSocket {
  private static readonly CONNECTING = 0
  private static readonly OPEN = 1
  private static readonly CLOSING = 2
  private static readonly CLOSED = 3

  private readyStateValue: number = DockerWebSocket.CONNECTING
  private listeners: Map<string, Array<(event: unknown) => void>> = new Map()
  private reader: ReadableStreamDefaultReader | null = null

  addEventListener(type: string, listener: (event: unknown) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)?.push(listener)
  }

  removeEventListener(type: string, listener: (event: unknown) => void) {
    const typeListeners = this.listeners.get(type)
    if (typeListeners) {
      const index = typeListeners.indexOf(listener)
      if (index > -1) {
        typeListeners.splice(index, 1)
      }
    }
  }

  async attach(response: Response) {
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

  close() {
    if (this.readyStateValue === DockerWebSocket.CLOSED) return

    this.readyStateValue = DockerWebSocket.CLOSING

    if (this.reader) {
      this.reader.cancel().catch(() => {})
    }

    this.readyStateValue = DockerWebSocket.CLOSED
    this.emit("close", {})
  }

  get CONNECTING() {
    return DockerWebSocket.CONNECTING
  }
  get OPEN() {
    return DockerWebSocket.OPEN
  }
  get CLOSING() {
    return DockerWebSocket.CLOSING
  }
  get CLOSED() {
    return DockerWebSocket.CLOSED
  }

  get readyState() {
    return this.readyStateValue
  }

  private emit(type: string, event: unknown) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      for (const listener of listeners) {
        listener(event)
      }
    }
  }
}
