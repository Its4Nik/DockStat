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
    isThemeSidebarOpen,
    setIsThemeSidebarOpen,
    createNewThemeFromTheme,
    theme,
    currentThemeColors,
    currentThemeName,
    currentThemeId,
    onColorChange,
    themes,
    onSelectTheme,
    toastSuccess,
  } = useThemeManager()

  useHotkey({
    close: () => setIsThemeSidebarOpen(false),
    closeKey: config?.hotkeys?.["close:themeEditor"] || "",
    isOpen: isThemeSidebarOpen,
    open: () => setIsThemeSidebarOpen(true),
    openKey: config?.hotkeys?.["open:themeEditor"] || "",
    toggle: () => setIsThemeSidebarOpen(!isThemeSidebarOpen),
    toggleKey: config?.hotkeys?.["toggle:themeEditor"] || "",
  })

  return {
    config,
    createNewThemeFromTheme,
    currentThemeColors,
    currentThemeId,
    currentThemeName,
    deleteTheme,
    frontendPluginRoutes,
    isBusy,
    isThemeSidebarOpen,
    logMessagesArr,
    onColorChange,
    onSelectTheme,
    pinMutation,
    ramUsage,
    setIsThemeSidebarOpen,
    theme,
    themes,
    toastSuccess,
    unPinMutation,
  }
}
