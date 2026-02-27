import { sleep } from "@dockstat/utils"
import { useContext, useEffect } from "react"
import { QueryClientContext } from "@/contexts/queryClient"
import { ThemeSidebarContext } from "@/contexts/themeSidebar"
import { useTheme } from "@/hooks/useTheme"
import { toast } from "@/lib/toast"

export function useThemeManager() {
  const themeSidebarCtx = useContext(ThemeSidebarContext)
  const { setThemeProps, addNewTheme, themeProps, isThemeSidebarOpen, setIsThemeSidebarOpen } =
    themeSidebarCtx
  const { theme, themesList, applyThemeById, adjustCurrentTheme } = useTheme()
  const qc = useContext(QueryClientContext)

  useEffect(() => {
    setThemeProps({
      currentThemeColors: Object.entries(theme?.vars || {}).map(([key, val]) => ({
        colorName: key,
        color: val,
      })),
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
      },
      onOpen: () => {},
      toastSuccess: (themeName: string) => {
        toast({
          description: `Set ${themeName} active`,
          title: "Updated Theme Preference",
          variant: "success",
        })
      },
    })
  }, [theme, themesList, setThemeProps, applyThemeById, adjustCurrentTheme])

  const createNewThemeFromTheme = async (
    name: string,
    animations: Record<string, unknown>,
    vars: Record<string, string>
  ) => {
    await addNewTheme(name, animations, vars)
    await sleep(10)
    qc.invalidateQueries({ queryKey: ["fetchAllThemes"] })
  }

  return {
    themeSidebarCtx,
    themeProps,
    isThemeSidebarOpen,
    setIsThemeSidebarOpen,
    createNewThemeFromTheme,
    theme,
  }
}
