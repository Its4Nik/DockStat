import { useTopicSubscription } from "@dockstat/utils/react"

/**
 * Subscribe to the "metrics/containers" topic via the shared WebSocketProvider
 * and return the latest RAM usage string.
 */
export function useRssFeed(): { data: string; stamp: number | undefined } | null {
  const { data, envelope: e } = useTopicSubscription<string>("rss")

  if (data === null) return null

  return { data, stamp: e?.timestamp }
}
