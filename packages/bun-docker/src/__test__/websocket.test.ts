import { describe, expect, it } from "bun:test"
import { DockerWebSocket } from "../modules/_socket/index"

function createMockReadableStream(
  chunks: Uint8Array[],
  { immediateClose = false } = {}
): ReadableStream<Uint8Array> {
  let index = 0

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (immediateClose && index === 0) {
        // Don't close immediately on first pull if we want to test OPEN state
        if (chunks.length === 0) {
          controller.close()
          return
        }
      }

      if (index < chunks.length) {
        controller.enqueue(chunks[index])
        index++
      } else {
        controller.close()
      }
    },
  })
}

describe("DockerWebSocket", () => {
  it("initial state should be CONNECTING", () => {
    const ws = new DockerWebSocket()
    expect(ws.readyState).toBe(ws.CONNECTING)
  })

  it("should have correct ready state constants", () => {
    const ws = new DockerWebSocket()
    expect(ws.CONNECTING).toBe(0)
    expect(ws.OPEN).toBe(1)
    expect(ws.CLOSING).toBe(2)
    expect(ws.CLOSED).toBe(3)
  })

  it("attach() should transition to OPEN and emit open event", async () => {
    const ws = new DockerWebSocket()
    const openEvents: unknown[] = []

    ws.addEventListener("open", (event) => {
      openEvents.push(event)
    })

    const body = createMockReadableStream([new TextEncoder().encode("hello")])
    const mockResponse = { body } as Response

    // Attach starts reading; give it a tick for the open event
    const attachPromise = ws.attach(mockResponse)
    await new Promise((resolve) => setTimeout(resolve, 10))

    // After open event fires, readyState should be OPEN
    // (stream hasn't finished yet since it has one chunk to read)
    expect(openEvents).toHaveLength(1)

    // Wait for the stream to complete
    await attachPromise
  })

  it("attach() should emit message events during reading", async () => {
    const ws = new DockerWebSocket()
    const messages: unknown[] = []

    ws.addEventListener("message", (event) => {
      messages.push(event)
    })

    const chunks = [new TextEncoder().encode("chunk1"), new TextEncoder().encode("chunk2")]
    const body = createMockReadableStream(chunks)
    const mockResponse = { body } as Response

    await ws.attach(mockResponse)

    expect(messages).toHaveLength(2)
    expect((messages[0] as { data: string }).data).toBe("chunk1")
    expect((messages[1] as { data: string }).data).toBe("chunk2")
    expect(ws.readyState).toBe(ws.CLOSED)
  })

  it("attach() should emit close event when stream ends", async () => {
    const ws = new DockerWebSocket()
    const closeEvents: unknown[] = []

    ws.addEventListener("close", (event) => {
      closeEvents.push(event)
    })

    const body = createMockReadableStream([new TextEncoder().encode("data")])
    const mockResponse = { body } as Response

    await ws.attach(mockResponse)

    expect(ws.readyState).toBe(ws.CLOSED)
    expect(closeEvents.length).toBeGreaterThanOrEqual(1)
  })

  it("attach() should handle response with no body", async () => {
    const ws = new DockerWebSocket()
    const errorEvents: unknown[] = []
    const closeEvents: unknown[] = []

    ws.addEventListener("error", (event) => {
      errorEvents.push(event)
    })
    ws.addEventListener("close", (event) => {
      closeEvents.push(event)
    })

    const mockResponse = { body: null } as Response

    await ws.attach(mockResponse)

    expect(ws.readyState).toBe(ws.CLOSED)
    expect(errorEvents).toHaveLength(1)
    expect(errorEvents[0]).toBeInstanceOf(Error)
    expect((errorEvents[0] as Error).message).toBe("Response has no body")
    expect(closeEvents).toHaveLength(1)
  })

  it("close() should transition to CLOSED and emit close event", () => {
    const ws = new DockerWebSocket()
    const closeEvents: unknown[] = []

    ws.addEventListener("close", (event) => {
      closeEvents.push(event)
    })

    ws.close()

    expect(ws.readyState).toBe(ws.CLOSED)
    expect(closeEvents).toHaveLength(1)
  })

  it("double close() should be safe", () => {
    const ws = new DockerWebSocket()
    const closeEvents: unknown[] = []

    ws.addEventListener("close", (event) => {
      closeEvents.push(event)
    })

    ws.close()
    ws.close()

    expect(ws.readyState).toBe(ws.CLOSED)
    expect(closeEvents).toHaveLength(1)
  })

  it("removeEventListener should remove listeners", () => {
    const ws = new DockerWebSocket()
    const closeEvents: unknown[] = []

    const handler = () => {
      closeEvents.push("fired")
    }

    ws.addEventListener("close", handler)
    ws.removeEventListener("close", handler)

    ws.close()

    expect(closeEvents).toHaveLength(0)
  })

  it("should handle empty stream (immediate close)", async () => {
    const ws = new DockerWebSocket()
    const openEvents: unknown[] = []
    const messageEvents: unknown[] = []
    const closeEvents: unknown[] = []

    ws.addEventListener("open", (e) => openEvents.push(e))
    ws.addEventListener("message", (e) => messageEvents.push(e))
    ws.addEventListener("close", (e) => closeEvents.push(e))

    const body = createMockReadableStream([])
    const mockResponse = { body } as Response

    await ws.attach(mockResponse)

    expect(openEvents).toHaveLength(1)
    expect(messageEvents).toHaveLength(0)
    expect(ws.readyState).toBe(ws.CLOSED)
  })
})
