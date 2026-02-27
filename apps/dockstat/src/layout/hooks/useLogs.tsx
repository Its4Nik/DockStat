import { logFeedEffect } from "@WSS"
import type { LogEntry } from "@dockstat/logger"
import { arrayUtils } from "@dockstat/utils"
import { useEffect, useState } from "react"
import { toast } from "@/lib/toast"

export function useLogs() {
  const [logMessage, setLogMessage] = useState<LogEntry>()
  const [logMessagesArr, setlogMessagesArr] = useState<LogEntry[]>([])

  useEffect(() => logFeedEffect(setLogMessage), [])

  useEffect(() => {
    if (!logMessage) return
    setlogMessagesArr((prev) => {
      const next = [...prev]
      arrayUtils.pushWithLimit<LogEntry>(next, logMessage)
      return next
    })
    if (logMessage.level === "error") {
      toast({
        variant: "error",
        title: (
          <p>
            A server error occurred! [<span className="text-accent">{logMessage.name}</span>]
          </p>
        ),
        description: logMessage.message,
      })
    }
  }, [logMessage])

  return logMessagesArr
}
