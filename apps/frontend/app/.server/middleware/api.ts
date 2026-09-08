import { authContext } from "@dockstat/auth/react-router"
import type { MiddlewareFunction, RouterContextProvider } from "react-router"
import { MetricsRecorder } from "../metrics/recorder"
import { DockStatDB } from "../singletons/db"

const recorder = new MetricsRecorder(DockStatDB._sqliteWrapper)
/**
 * Records request metrics for every /api request, then lets the request
 * continue. Mirrors the old API's MetricsMiddleware.
 */
export const apiMetricsMiddleware: MiddlewareFunction<Response> = async ({ request }, next) => {
  const start = performance.now()
  const path = new URL(request.url).pathname
  const method = request.method

  try {
    const result = await next()
    const status =
      result instanceof Response
        ? result.status
        : ((result as { init?: { status?: number } })?.init?.status ?? 200)
    recorder.record(method, path, status, performance.now() - start)
    return result
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error as { statusCode: number }).statusCode)
        : 500
    recorder.record(method, path, status, performance.now() - start, true)
    throw error
  }
}

/**
 * Rejects unauthenticated requests with a 401 before any loader/action runs.
 * Reads the user the root middleware already verified — no double work.
 */
export const authGuardMiddleware: MiddlewareFunction<Response> = async ({ context }) => {
  const user = context.get(authContext)
  if (!user) {
    return Response.json({ error: "Authentication required" }, { status: 401 })
  }
}

/** Loader/action helper: the authenticated user from router context. */
export function currentUser(context: Readonly<RouterContextProvider>) {
  return context.get(authContext)
}
