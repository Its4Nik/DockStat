import { pinNavLink, unPinNavLink } from "@Actions"
import { fetchFrontendPluginRoutes, fetchNavLinks } from "@Queries"
import { logFeedEffect, rssFeedEffect } from "@WSS"
import type { LogEntry } from "@dockstat/logger"
import { Navbar } from "@dockstat/ui"
import { arrayUtils } from "@dockstat/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useContext, useEffect, useState } from "react"
import { Toaster } from "sonner"
import { AdditionalSettingsContext } from "@/contexts/additionalSettings"
import { toast } from "./components/toast"
import { PageHeadingContext } from "./contexts/pageHeadingContext"
import { useGlobalBusy } from "./hooks/useGlobalBusy"

export default function Layout({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()

  const [ramUsage, setRamUsage] = useState<string>("Connecting...")
  const [logMessage, setLogMessage] = useState<LogEntry>()
  const [logMessagesArr, setlogMessagesArr] = useState<LogEntry[]>([])

  const showRamUsage = useContext(AdditionalSettingsContext).showBackendRamUsageInNavbar
  const heading = useContext(PageHeadingContext).heading
  const isBusy = useGlobalBusy()

  const { data: navLinks } = useQuery({
    queryKey: ["fetchNavLinks"],
    queryFn: fetchNavLinks,
  })

  const { data: frontendPluginRoutes } = useQuery({
    queryKey: ["fetchFrontendPluginRoutes"],
    queryFn: fetchFrontendPluginRoutes,
  })

  const pinMutation = useMutation({
    mutationFn: pinNavLink,
    mutationKey: ["pinNavLink"],
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["fetchNavLinks"] })
    },
  })

  const unPinMutation = useMutation({
    mutationFn: unPinNavLink,
    mutationKey: ["unPinNavLink"],
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["fetchNavLinks"] })
    },
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

  return (
    <div className="bg-main-bg min-h-screen w-screen p-4">
      <Toaster expand position="bottom-right" />
      <Navbar
        isBusy={isBusy}
        navLinks={navLinks}
        pluginLinks={frontendPluginRoutes || []}
        ramUsage={showRamUsage ? ramUsage : undefined}
        logEntries={logMessagesArr}
        heading={heading}
        mutationFn={{ pin: pinMutation, unpin: unPinMutation }}
      />
      <div className="px-4">{children}</div>
    </div>
  )
}
