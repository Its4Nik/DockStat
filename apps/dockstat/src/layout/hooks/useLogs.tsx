import { logFeedEffect } from "@WSS"
import type { LogEntry } from "@dockstat/logger"
import { arrayUtils } from "@dockstat/utils"
import { useContext, useEffect, useState } from "react"
import { toast } from "@/lib/toast"
import { ConfigProviderContext } from "@/contexts/config"

export function useLogs() {
  const settingsCtx = useContext(ConfigProviderContext)

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

    if (logMessage.level === "error" && (settingsCtx.additionalSettings?.showBackendErrorLogs ?? true) === true) {
      console.error(logMessage)
      toast({
        description: logMessage.message,
        title: (
          <div>
            <p>A server error occurred!</p>
            <span className="text-accent">{logMessage.name}</span>
          </div>
        ),
        variant: "error",
      })
    }
  }, [logMessage])

  return logMessagesArr
}
