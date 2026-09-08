/**
 * React hook for subscribing to live widget data via WebSocket.
 *
 * Requires a `WebSocketProvider` from `@dockstat/utils/react`
 * to be mounted somewhere above in the component tree.
 *
 * @example
 * ```tsx
 * // In your App root:
 * <WebSocketProvider url="/api/v2/ws" requireAuth>
 *   <DashboardPage />
 * </WebSocketProvider>
 *
 * // In a component:
 * const { data, connected, evaluate } = useWidgetData({
 *   dashboardId: "my-dashboard",
 * })
 * ```
 */
import { useTopicSubscription, type WSServerEnvelope } from "@dockstat/utils/react"
import { useCallback } from "react"
import type { DataPayload } from "../types"
import type { UseWidgetDataOptions, UseWidgetDataReturn } from "./types"

interface WidgetDataEnvelope extends WSServerEnvelope {
  data: {
    dashboardId?: string
    payloads?: DataPayload[]
    type?: string
  }
}

export function useWidgetData(options: UseWidgetDataOptions): UseWidgetDataReturn {
  const { dashboardId, keys, onUpdate } = options

  const transform = useCallback(
    (envelope: WSServerEnvelope): DataPayload[] => {
      const data = (envelope as WidgetDataEnvelope).data
      const payloads = data.payloads ?? []

      if (keys && keys.length > 0) {
        return payloads.filter((p) => keys.includes(p.key))
      }
      return payloads
    },
    [keys]
  )

  const { connected, data, error, unsubscribe } = useTopicSubscription<DataPayload[]>(
    `widgets/dashboard/${dashboardId}`,
    {
      // Only log in dev; the previous hardcoded `true` spammed the console
      // on every re-subscribe. Cast because this package isn't bundled by
      // Vite directly so `import.meta.env.DEV` isn't typed here — the
      // consumer (dockstat) injects it at build time.
      debugLog: Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV),
      onMessage: onUpdate
        ? (payloads, _envelope) => {
            onUpdate(payloads)
          }
        : undefined,
      transform,
    }
  )

  const evaluate = useCallback(async () => {
    console.debug("Evaluating data-pipe for ", dashboardId)
    try {
      // Cookie-authenticated fetch against the React Router API surface
      const response = await fetch(
        `/api/v2/widgets/data-pipe/evaluate/${encodeURIComponent(dashboardId)}`,
        { headers: { accept: "application/json" }, method: "POST" }
      )
      if (!response.ok) {
        throw new Error(`Evaluation failed with status ${response.status}`)
      }

      const result = (await response.json()) as {
        payloads?: DataPayload[]
        success?: boolean
        message?: string
      }

      if (result.success === false) {
        throw new Error(`Evaluation failed: ${result.message}`)
      }

      if (result.payloads) {
        onUpdate?.(result.payloads)
      }
    } catch {
      // Error is available via the `error` return value
    }
  }, [dashboardId, onUpdate])

  return { connected, data, error, evaluate, unsubscribe }
}
