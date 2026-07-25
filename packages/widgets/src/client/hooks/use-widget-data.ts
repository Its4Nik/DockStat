/**
 * React hook for subscribing to live widget data via WebSocket.
 *
 * Requires a `WebSocketProvider` from `@dockstat/utils/react`
 * to be mounted somewhere above in the component tree.
 *
 * @example
 * ```tsx
 * // In your App root:
 * <WebSocketProvider url="/api/v2/ws/widgets" requireAuth>
 *   <DashboardPage />
 * </WebSocketProvider>
 *
 * // In a component:
 * const { data, connected, evaluate } = useWidgetData({
 *   dashboardId: "my-dashboard",
 * })
 * ```
 */
import type { TreatyType } from "@dockstat/api"
import { treaty } from "@elysiajs/eden"

type ApiClient = ReturnType<typeof treaty<TreatyType>>["api"]["v2"]

const api: ApiClient = treaty<TreatyType>(
  import.meta.env.DOCKSTAT_API_PORT || `http://localhost:3030`,
  {
    fetch: {
      credentials: "include",
    },
  }
).api.v2

import { eden, useTopicSubscription, type WSServerEnvelope } from "@dockstat/utils/react"
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

  const evaluateDataPipe = eden.Client({
    mutationKey: ["data-pipe-evaluate", dashboardId],
    routeBuilder: ({ dashboardId }: { dashboardId: string }) => api.widgets["data-pipe"].evaluate({ dashboardId }).post,
  })

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
      onMessage: onUpdate
        ? (payloads, _envelope) => {
            onUpdate(payloads)
          }
        : undefined,
      transform,
      debugLog: true
    }
  )

  const evaluate = useCallback(async () => {
    console.debug("Evaluating data-pipe for ", dashboardId )
    try {
      const {payloads,success,message} = await evaluateDataPipe.mutateAsync({params: {dashboardId}})

      if (!success) {
        throw new Error(`Evaluation failed: ${message}`)
      }

      if (success && payloads) {
        onUpdate?.(payloads)
      }
    } catch {
      // Error is available via the `error` return value
    }
  }, [dashboardId, onUpdate])

  return { connected, data, error, evaluate, unsubscribe }
}
