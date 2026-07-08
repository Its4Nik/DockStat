import type { LogEntry } from "@dockstat/logger"
import type { Dispatch, SetStateAction } from "react"
import { createTopicSubscription } from "./topicSubscription"

export const logFeedEffect = (setLogMessage: Dispatch<SetStateAction<LogEntry | undefined>>) => {
  return createTopicSubscription<LogEntry>("logs", (data) => {
    setLogMessage(data)
  })
}
