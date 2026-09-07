import { isbot } from "isbot"
import { renderToReadableStream } from "react-dom/server"
import type { EntryContext, RouterContextProvider } from "react-router"
import { ServerRouter } from "react-router"

export const streamTimeout = 5_000

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      headers: responseHeaders,
      status: responseStatusCode,
    })
  }

  let shellRendered = false
  const userAgent = request.headers.get("user-agent")

  const body = await renderToReadableStream(
    <ServerRouter
      context={routerContext}
      url={request.url}
    />,
    {
      onError(error: unknown) {
        responseStatusCode = 500
        // Log streaming rendering errors from inside the shell
        if (shellRendered) {
          console.error(error)
        }
      },
      signal: AbortSignal.timeout(streamTimeout + 1000),
    }
  )
  shellRendered = true

  // Ensure requests from bots and SPA Mode renders wait for all content to load
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady
  }

  responseHeaders.set("Content-Type", "text/html")
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}

export function handleError(error: unknown, { request }: { request: Request }) {
  if (!request.signal.aborted) {
    console.error(error)
  }
}
