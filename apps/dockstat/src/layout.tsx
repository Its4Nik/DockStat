import type { LogEntry } from "@dockstat/logger"
import { Navbar } from "@dockstat/ui"
import { arrayUtils } from "@dockstat/utils"
import { useQuery } from "@tanstack/react-query"
import { useContext, useEffect, useState } from "react"
import { AdditionalSettingsContext } from "@/contexts/additionalSettings"
import { PageHeadingContext } from "./contexts/pageHeadingContext"
import { useGlobalBusy } from "./hooks/isLoading"
import { fetchNavLinks } from "./lib/queries/fetchNavLinks"
import { logFeedEffect } from "./lib/websocketEffects/logFeed"
import { rssFeedEffect } from "./lib/websocketEffects/rssFeed"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [ramUsage, setRamUsage] = useState<string>("Connecting...")
  const [logMessage, setLogMessage] = useState<LogEntry>()
  const [logMessagesArr, setlogMessagesArr] = useState<LogEntry[]>([])

  const showRamUsage = useContext(AdditionalSettingsContext).showBackendRamUsageInNavbar
  const heading = useContext(PageHeadingContext).heading

  let { data } = useQuery({
    queryKey: ["fetchNavLinks"],
    queryFn: fetchNavLinks,
  })

  useEffect(() => rssFeedEffect(setRamUsage), [])
  useEffect(() => logFeedEffect(setLogMessage), [])

  useEffect(() => {
    if (!logMessage) return

    setlogMessagesArr((prev) => {
      const next = [...prev]
      arrayUtils.pushWithLimit<LogEntry>(next, logMessage)
      return next
    })
  }, [logMessage])

  if (data?.length === 0) {
    data = [
      {
        slug: "Home",
        path: "/",
      },
      {
        slug: "Clients",
        path: "/clients",
      },
      {
        slug: "Plugins",
        path: "/plugins",
      },
    ]
  }

  return (
    <div className="bg-main-bg min-h-screen w-screen p-4">
      <Navbar
        isBusy={useGlobalBusy()}
        paths={data}
        ramUsage={showRamUsage ? ramUsage : undefined}
        logEntries={logMessagesArr}
        heading={heading}
      />
      <div className="px-4">{children}</div>
    </div>
  )
}
