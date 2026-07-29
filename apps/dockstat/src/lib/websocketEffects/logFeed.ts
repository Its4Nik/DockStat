import type { LogEntry } from "@dockstat/logger"
import { useTopicData } from "./topicSubscription"

/**
 * Subscribe to the "logs" topic via the shared WebSocketProvider
 * and return the latest log entry.
 */
export function useLogFeed(): LogEntry | null {
  return useTopicData<LogEntry>("logs")
}
