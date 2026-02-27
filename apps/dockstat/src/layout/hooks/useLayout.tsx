import { useHotkey } from "@dockstat/utils/react"
import { useContext } from "react"
import { ConfigProviderContext } from "@/contexts/config"
import { useGlobalBusy } from "@/hooks/useGlobalBusy"
import { useDeleteTheme } from "./useDeleteTheme"
import { useLogs } from "./useLogs"
import { usePinMutations } from "./usePinMutations"
import { usePluginRoutes } from "./usePluginRoutes"
import { useRamUsage } from "./useRamUsage"
import { useThemeManager } from "./useThemeManager"

export function useLayout() {
  const ramUsage = useRamUsage()
  const logMessagesArr = useLogs()
  const isBusy = useGlobalBusy()
  const config = useContext(ConfigProviderContext)
  const frontendPluginRoutes = usePluginRoutes()
  const { pinMutation, unPinMutation } = usePinMutations()
  const deleteTheme = useDeleteTheme()

  const {
    themeSidebarCtx,
    themeProps,
    isThemeSidebarOpen,
    setIsThemeSidebarOpen,
    createNewThemeFromTheme,
    theme,
  } = useThemeManager()

  useHotkey({
    close: () => setIsThemeSidebarOpen(false),
    open: () => setIsThemeSidebarOpen(true),
    isOpen: isThemeSidebarOpen,
    toggle: () => setIsThemeSidebarOpen(!isThemeSidebarOpen),
    toggleKey: config?.hotkeys?.["toggle:themeEditor"] || "",
    closeKey: config?.hotkeys?.["close:themeEditor"] || "",
    openKey: config?.hotkeys?.["open:themeEditor"] || "",
  })

  return {
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
  }
}
