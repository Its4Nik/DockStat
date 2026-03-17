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
      console.error(logMessage)
      toast({
        variant: "error",
        title: (
          <div>
            <p>A server error occurred!</p>
            <span className="text-accent">{logMessage.name}</span>]
          </div>
        ),
        description: logMessage.message,
      })
    }
  }, [logMessage])

  return logMessagesArr
}
