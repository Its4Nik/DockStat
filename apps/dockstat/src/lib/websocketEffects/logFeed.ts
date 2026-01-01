import type { LogEntry } from "@dockstat/logger"
import type { Dispatch, SetStateAction } from "react"
import { api } from "../api"

export const logFeedEffect = (setLogMessage: Dispatch<SetStateAction<LogEntry | undefined>>) => {
  const logFeed = api.api.v2.ws.logs.subscribe()

  logFeed.subscribe((message) => {
    setLogMessage(message.data)
  })

  return () => {
    logFeed.close()
  }
}
