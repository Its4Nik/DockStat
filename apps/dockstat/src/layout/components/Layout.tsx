import { Navbar, ThemeSidebar } from "@dockstat/ui"
import { useContext } from "react"
import { Toaster } from "sonner"
import { PageHeadingContext } from "@/contexts/pageHeadingContext"
import { toast } from "@/lib/toast"
import { useLayout } from "../hooks/useLayout"

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    ramUsage,
    logMessagesArr,
    isBusy,
    themeSidebarCtx,
    config,
    themeProps,
    isThemeSidebarOpen,
    setIsThemeSidebarOpen,
    frontendPluginRoutes,
    pinMutation,
    unPinMutation,
    deleteTheme,
    createNewThemeFromTheme,
    theme,
  } = useLayout()

  const heading = useContext(PageHeadingContext).heading

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
