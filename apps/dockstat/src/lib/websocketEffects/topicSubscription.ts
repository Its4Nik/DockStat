/**
 * Topic subscription helpers backed by the shared WebSocketProvider.
 *
 * The old implementation opened a new WebSocket connection per topic.
 * The new approach uses `useTopicSubscription` from `@dockstat/utils/react`,
 * which shares a single connection across the whole component tree via
 * React Context.
 *
 * These helpers are thin wrappers that return the latest data for a given
 * topic and keep local React state in sync — useful for live dashboards,
 * log streams, or any stream that updates faster than polling.
 *
 * @example
 * ```tsx
 * function RamGauge() {
 *   const ram = useTopicData<string>("metrics/containers")
 *   return <div>RSS: {ram}</div>
 * }
 * ```
 */

import { useTopicSubscription } from "@dockstat/utils/react"

/**
 * Subscribe to a WebSocket topic and return the latest data payload.
 *
 * Returns `null` until the first message arrives.
 */
export function useTopicData<TData = unknown>(topic: string): TData | null {
  const { data } = useTopicSubscription<TData>(topic)
  return data
}
