import type { LogEntry } from "@dockstat/logger"
import { api } from "../api"
import type { Dispatch, SetStateAction } from "react"

export const logFeedEffect = (setLogMessage: Dispatch<SetStateAction<LogEntry | undefined>>) => {
  const logFeed = api.api.v2.ws.logs.subscribe()

  logFeed.subscribe((message) => {
    setLogMessage(message.data)
  })

  return () => {
    logFeed.close()
  }
}
