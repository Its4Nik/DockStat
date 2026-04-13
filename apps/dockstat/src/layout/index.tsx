export { useLayout } from "./hooks/useLayout"

import { Navbar, ThemeSidebar } from "@dockstat/ui"
import { useContext } from "react"
import { Toaster } from "sonner"
import { PageHeadingContext } from "@/contexts/pageHeadingContext"
import { createPinMutationHandlers } from "@/utils/createPinMutations"
import { useLayout } from "./hooks/useLayout"

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    ramUsage,
    logMessagesArr,
    isBusy,
    config,
    currentThemeColors,
    currentThemeName,
    currentThemeId,
    onColorChange,
    themes,
    onSelectTheme,
    toastSuccess,
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
      <Toaster
        expand
        position="bottom-right"
      />
      <Navbar
        currentThemeId={currentThemeId}
        deleteTheme={deleteTheme}
        heading={heading}
        isBusy={isBusy}
        logEntries={logMessagesArr}
        mutationFn={createPinMutationHandlers({ isBusy, pinMutation, unPinMutation })}
        navLinks={config?.navLinks || []}
        onColorChange={onColorChange}
        onSelectTheme={onSelectTheme}
        openQuickLinksModalHotkey={config?.hotkeys?.["open:quicklinks"]}
        pluginLinks={frontendPluginRoutes || []}
        ramUsage={config.additionalSettings?.showBackendRamUsageInNavbar ? ramUsage : undefined}
        setIsThemeSidebarOpen={setIsThemeSidebarOpen}
        sidebarHotkeys={{
          close: config.hotkeys?.["close:sidebar"],
          open: config.hotkeys?.["open:sidebar"],
          toggle: config.hotkeys?.["toggle:sidebar"],
        }}
        themes={themes}
        toastSuccess={toastSuccess}
      />

      <div className="px-4">{children}</div>

      <ThemeSidebar
        allColors={currentThemeColors || []}
        currentTheme={currentThemeName || "Undefined"}
        currentThemeValues={{
          animations: {},
          vars: theme?.vars || {},
        }}
        isOpen={isThemeSidebarOpen}
        onClose={() => {
          setIsThemeSidebarOpen(false)
        }}
        onColorChange={onColorChange}
        saveNewTheme={createNewThemeFromTheme}
      />
    </div>
  )
}
