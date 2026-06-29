import type { LogEntry } from "@dockstat/logger"
import type { Dispatch, SetStateAction } from "react"
import { api, getAuthHeaders } from "../api"

export const logFeedEffect = (setLogMessage: Dispatch<SetStateAction<LogEntry | undefined>>) => {
  const logFeed = api.ws.logs.subscribe({ headers: getAuthHeaders() })

  logFeed.subscribe((message) => {
    setLogMessage(message.data)
  })

  return () => {
    logFeed.close()
  }
}
