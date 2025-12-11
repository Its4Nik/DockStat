import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLoaderData } from "react-router"
import { api } from "~/.server/treaty"

export async function loader() {
  return {
    posts: await api.posts.get(),
    ws: api.ws.test.subscribe().url,
  }
}

export default function ExampleRoute() {
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState<string>("")
  const [status, setStatus] = useState<"idle" | "connecting" | "open" | "closed" | "error">("idle")
  const { posts, ws } = useLoaderData<typeof loader>()
  const data = posts.data
  const wsRef = useRef<WebSocket | null>(null)

  // append incoming messages (most recent first)
  const handleNewMessage = useCallback((message: string) => {
    setMessages((prev) => [message, ...prev])
  }, [])

  useEffect(() => {
    if (!ws) return
    setStatus("connecting")

    const socket = new WebSocket(ws)
    wsRef.current = socket

    const onOpen = () => {
      setStatus("open")
      console.log("WebSocket opened:", ws)
    }

    const onMessage = (ev: MessageEvent) => {
      let payload: string
      try {
        // try to pretty-print JSON, otherwise fallback to raw string
        const parsed = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data
        payload = typeof parsed === "string" ? parsed : JSON.stringify(parsed)
      } catch {
        payload = typeof ev.data === "string" ? ev.data : JSON.stringify(ev.data)
      }
      handleNewMessage(payload)
    }

    const onClose = (ev: CloseEvent) => {
      setStatus("closed")
      console.log("WebSocket closed:", ev.code, ev.reason)
    }

    const onError = (err: Event) => {
      setStatus("error")
      console.error("WebSocket error:", err)
    }

    socket.addEventListener("open", onOpen)
    socket.addEventListener("message", onMessage)
    socket.addEventListener("close", onClose)
    socket.addEventListener("error", onError)

    return () => {
      socket.removeEventListener("open", onOpen)
      socket.removeEventListener("message", onMessage)
      socket.removeEventListener("close", onClose)
      socket.removeEventListener("error", onError)
      try {
        socket.close()
      } catch {
        /* ignore */
      }
      wsRef.current = null
    }
  }, [ws, handleNewMessage])

  const sendMessage = useCallback((raw: string) => {
    const socket = wsRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not open — cannot send")
      return false
    }
    try {
      setMessages((prev) => [raw, ...prev])
      socket.send(raw)
      return true
    } catch (err) {
      console.error("Failed to send message:", err)
      return false
    }
  }, [])

  const handleSendClick = () => {
    if (!input.trim()) return
    const ok = sendMessage(input.trim())
    if (ok) setInput("")
  }

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendClick()
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <header className="rounded-2xl bg-linear-to-r from-white/60 to-white/30 dark:from-gray-800/50 dark:to-gray-800/40 p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <div className="h-14 w-14 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-md">
                E
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Response status:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {posts?.status ?? "—"}
                </span>
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                ElysiaJS Example Posts
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                These posts were loaded via an ElysiaJS endpoint.
              </p>
            </div>
          </div>
        </header>

        {/* Posts grid */}
        <section className="mt-8">
          <h2 className="sr-only">Posts</h2>
          {data && data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {data.map((obj) => (
                <PostCard key={obj.name} obj={obj} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg p-6 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-600 dark:text-gray-300">No posts found.</p>
            </div>
          )}
        </section>

        {/* WebSocket area */}
        <section className="mt-10 rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                WebSocket Example
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Live messages and connection status.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 break-all">
                Connected to:{" "}
                <span className="font-medium text-gray-800 dark:text-gray-100">{ws ?? "—"}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <StatusDot status={status} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {status ?? "unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <label htmlFor="ws-input" className="sr-only">
                Message
              </label>
              <input
                id="ws-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Type a message and press Enter"
                className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 transition text-sm text-gray-900 dark:text-gray-100"
                aria-label="Message input"
                autoComplete="off"
              />

              <button
                type="button"
                onClick={handleSendClick}
                disabled={wsRef?.current?.readyState !== WebSocket.OPEN}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                  wsRef?.current?.readyState === WebSocket.OPEN
                    ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-300"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M2.94 2.94a1 1 0 011.414 0L17 15.586V11a1 1 0 112 0v6a1 1 0 01-1 1h-6a1 1 0 110-2h4.586L4.354 4.354a1 1 0 010-1.414z" />
                </svg>
                Send
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="mt-6 space-y-3 max-h-38 overflow-clip">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet.</p>
            ) : (
              messages.map((m, i) => (
                <MessageBubble
                  key={`${i}-${String(m).slice(0, 40)}`}
                  text={`${m}`}
                  isOwn={!m.startsWith("Elysia received:")}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

/** small status dot helper */
function StatusDot({ status }: { status: string }) {
  const color =
    status === "open"
      ? "bg-green-500"
      : status === "connecting"
        ? "bg-yellow-400"
        : status === "closed" || status === "error"
          ? "bg-red-500"
          : "bg-gray-300"

  return <span className={`h-3 w-3 rounded-full ${color}`} aria-hidden />
}

function PostCard({ obj }: { obj: { name: string; url: string; description: string } }) {
  function getInitials(name = "") {
    return name
      .split(" ")
      .map((p) => p[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("")
  }

  const initials = getInitials(obj.name)
  return (
    <Link
      to={obj.url}
      className="group flex flex-col gap-3 rounded-xl border border-transparent bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <div className="h-12 w-12 rounded-full bg-linear-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
            {obj.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{obj.description}</p>
        </div>

        <div className="ml-auto self-center">
          <svg
            className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function MessageBubble({ text, isOwn }: { text: string; isOwn: boolean }) {
  const alignment = isOwn ? "justify-end" : "justify-start"
  const bg = isOwn
    ? "bg-blue-600 text-white"
    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700"
  return (
    <>
      <div className={`flex ${alignment}`}>
        <div className={`max-w-[80%] px-4 py-2 rounded-lg shadow-sm ${bg}`}>
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
            {String(text)}
          </pre>
        </div>
      </div>
    </>
  )
}
