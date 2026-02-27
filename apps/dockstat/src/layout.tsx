import { logFeedEffect, rssFeedEffect } from "@WSS"
import type { LogEntry } from "@dockstat/logger"
import { Navbar, ThemeSidebar } from "@dockstat/ui"
import { arrayUtils, retry, sleep } from "@dockstat/utils"
import { useHotkey } from "@dockstat/utils/react"
import { useContext, useEffect, useState } from "react"
import { Toaster } from "sonner"
import { ConfigProviderContext } from "@/contexts/config"
import { PageHeadingContext } from "./contexts/pageHeadingContext"
import { QueryClientContext } from "./contexts/queryClient"
import { ThemeSidebarContext } from "./contexts/themeSidebar"
import { useEdenMutation } from "./hooks/eden/useEdenMutation"
import { edenQuery, useEdenQuery } from "./hooks/useEdenQuery"
import { useGlobalBusy } from "./hooks/useGlobalBusy"
import { useTheme } from "./hooks/useTheme"
import { api } from "./lib/api"
import { toast } from "./lib/toast"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [ramUsage, setRamUsage] = useState<string>("Connecting...")
  const [logMessage, setLogMessage] = useState<LogEntry>()
  const [logMessagesArr, setlogMessagesArr] = useState<LogEntry[]>([])

  const isBusy = useGlobalBusy()

  const themeSidebarCtx = useContext(ThemeSidebarContext)
  const config = useContext(ConfigProviderContext)
  const heading = useContext(PageHeadingContext).heading
  const { isThemeSidebarOpen, setIsThemeSidebarOpen, setThemeProps, themeProps } =
    useContext(ThemeSidebarContext)
  const qc = useContext(QueryClientContext)

  qc.invalidateQueries({ queryKey: ["fetchAllThemes"] })

  const { theme, themesList, getAllThemes, applyThemeById, adjustCurrentTheme } = useTheme()

  // Set theme props in context for global access
  useEffect(() => {
    setThemeProps({
      currentThemeColors: Object.entries(theme?.vars || {}).map(([key, val]) => {
        return { colorName: key, color: val }
      }),
      currentThemeName: theme?.name || "Undefined",
      onColorChange: (colorValue, colorName) => {
        adjustCurrentTheme({ [colorName]: colorValue })
        toast({
          description: `Changed: ${colorName} to ${colorValue}`,
          title: "Updated color",
        })
      },
      themes: themesList || [],
      currentThemeId: theme?.id ?? null,
      onSelectTheme: async (t) => {
        await applyThemeById(t.id)
        // Refresh the theme list after applying a new theme
        await getAllThemes()
      },
      onOpen: getAllThemes,
      toastSuccess: (themeName: string) => {
        toast({
          description: `Set ${themeName} active`,
          title: "Updated Theme Preference",
          variant: "success",
        })
      },
    })
  }, [theme, themesList, getAllThemes, applyThemeById, adjustCurrentTheme, setThemeProps])

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

  const deleteThemeMutation = useEdenMutation({
    mutationKey: ["deleteTheme"],
    route: api.themes.delete,
    toast: {
      successTitle: (input) => `Deleted theme ${input.id}`,
      errorTitle: (input) => `Could not delete theme ${input.id}`,
    },
  })

  const deleteTheme = async (id: number) => {
    await deleteThemeMutation.mutateAsync({ id })
  }

  useHotkey({
    close: () => setIsThemeSidebarOpen(false),
    open: () => setIsThemeSidebarOpen(true),
    isOpen: isThemeSidebarOpen,
    toggle: () => setIsThemeSidebarOpen(!isThemeSidebarOpen),
    toggleKey: config?.hotkeys?.["toggle:themeEditor"] || "",
    closeKey: config?.hotkeys?.["close:themeEditor"] || "",
    openKey: config?.hotkeys?.["open:themeEditor"] || "",
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

  const createNewThemeFromTheme = async (
    name: string,
    animations: Record<string, unknown>,
    vars: Record<string, string>
  ) => {
    await themeSidebarCtx.addNewTheme(name, animations, vars)
    console.log("Theme created")
    await sleep(10) // needed, otherwise the theme list does not get updated
    await getAllThemes()
    console.log("Themes updated")
  }

  return (
    <div className="bg-main-bg min-h-screen w-screen p-4">
      <Toaster expand position="bottom-right" />
      <Navbar
        deleteTheme={deleteTheme}
        themeProps={{
          ...themeSidebarCtx?.themeProps,
          currentThemeName: themeSidebarCtx?.themeProps?.currentThemeName || "Undefined",
          currentThemeId: themeSidebarCtx?.themeProps?.currentThemeId || null,
          themes: themeSidebarCtx?.themeProps?.themes || [],
          isOpen: themeSidebarCtx.isThemeSidebarOpen,
          onSelectTheme: themeSidebarCtx?.themeProps?.onSelectTheme || (() => {}),
          toastSuccess: themeSidebarCtx?.themeProps?.toastSuccess || ((_: string) => {}),
          onOpen: () => themeSidebarCtx.setIsThemeSidebarOpen(true),
          currentThemeColors: themeSidebarCtx?.themeProps?.currentThemeColors || [],
          onColorChange: (color, colorName) =>
            themeSidebarCtx?.themeProps?.onColorChange(color, colorName),
        }}
        sidebarHotkeys={{
          close: config.hotkeys?.["close:sidebar"],
          open: config.hotkeys?.["close:sidebar"],
          toggle: config.hotkeys?.["toggle:sidebar"],
        }}
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
        openQuickLinksModalHotkey={config?.hotkeys?.["open:quicklinks"]}
      />
      <div className="px-4">{children}</div>

      {themeProps && (
        <ThemeSidebar
          currentThemeValues={{
            vars: theme?.vars || {},
            animations: {},
          }}
          saveNewTheme={createNewThemeFromTheme}
          onColorChange={themeProps.onColorChange}
          isOpen={isThemeSidebarOpen}
          allColors={themeProps.currentThemeColors || []}
          currentTheme={themeProps.currentThemeName || "Undefined"}
          onClose={() => {
            setIsThemeSidebarOpen(false)
          }}
        />
      )}
    </div>
  )
}
