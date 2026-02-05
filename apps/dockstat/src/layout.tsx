import { logFeedEffect, rssFeedEffect } from "@WSS"
import type { LogEntry } from "@dockstat/logger"
import { Navbar } from "@dockstat/ui"
import { arrayUtils } from "@dockstat/utils"
import { useContext, useEffect, useState } from "react"
import { Toaster } from "sonner"
import { ConfigProviderContext } from "@/contexts/config"
import { PageHeadingContext } from "./contexts/pageHeadingContext"
import { useEdenMutation } from "./hooks/eden/useEdenMutation"
import { useEdenQuery } from "./hooks/useEdenQuery"
import { useGlobalBusy } from "./hooks/useGlobalBusy"
import { useTheme } from "./hooks/useTheme"
import { api } from "./lib/api"
import { toast } from "./lib/toast"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [ramUsage, setRamUsage] = useState<string>("Connecting...")
  const [logMessage, setLogMessage] = useState<LogEntry>()
  const [logMessagesArr, setlogMessagesArr] = useState<LogEntry[]>([])

  const config = useContext(ConfigProviderContext)
  const heading = useContext(PageHeadingContext).heading

  const { theme, themesList, getAllThemes, applyThemeById } = useTheme()
  const isBusy = useGlobalBusy()

  const { data: frontendPluginRoutes } = useEdenQuery({
    queryKey: ["fetchFrontendPluginRoutes"],
    route: api.plugins.frontend.routes.get,
  })

  const pinMutation = useEdenMutation({
    mutationKey: ["pinNavLink"],
    route: api.db.config.pinItem.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
  })

  const unPinMutation = useEdenMutation({
    mutationKey: ["unPinNavLink"],
    route: api.db.config.unpinItem.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
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
        navLinks={config?.navLinks || []}
        pluginLinks={frontendPluginRoutes || []}
        ramUsage={config.additionalSettings?.showBackendRamUsageInNavbar ? ramUsage : undefined}
        logEntries={logMessagesArr}
        heading={heading}
        mutationFn={{
          pin: (input: { path: string; slug: string }) => {
            toast({
              title: `Pinned "${input.slug}"!`,
              description: (
                <span>
                  Added a new pinned link: "{input.slug}" - <pre>{input.path}</pre>
                </span>
              ),
              variant: "success",
            })

            return pinMutation.mutateAsync(input)
          },
          unpin: (input: { path: string; slug: string }) => {
            toast({
              title: `Unpinned "${input.slug}"!`,
              description: (
                <span>
                  Added a new pinned link: "{input.slug}" - <pre>{input.path}</pre>
                </span>
              ),
              variant: "success",
            })

            return unPinMutation.mutateAsync(input)
          },
          isBusy: isBusy,
        }}
        openQuickLinksModalHotkey={config?.hotkeys?.["open:quicklinks"] || "k"}
        themeProps={{
          themes: themesList || [],
          currentThemeId: theme?.id ?? null,
          onSelectTheme: (t) => applyThemeById(t.id),
          onOpen: getAllThemes,
          toastSuccess: () => {
            toast({
              description: `Set ${theme?.id} active`,
              title: "Updated Theme Preference",
              variant: "success",
            })
          },
        }}
      />
      <div className="px-4">{children}</div>
    </div>
  )
}
