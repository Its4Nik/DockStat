import { sleep } from "@dockstat/utils"
import { useContext, useEffect, useRef } from "react"
import { QueryClientContext } from "@/contexts/queryClient"
import { ThemeSidebarContext } from "@/contexts/themeSidebar"
import { useTheme } from "@/hooks/useTheme"
import { toast } from "@/lib/toast"

export function useThemeManager() {
  const themeSidebarCtx = useContext(ThemeSidebarContext)
  const { theme, themesList, applyThemeById, adjustCurrentTheme } = useTheme()
  const { setThemeProps, addNewTheme, themeProps, isThemeSidebarOpen, setIsThemeSidebarOpen } =
    themeSidebarCtx
  const applyThemeByIdRef = useRef(applyThemeById)
  const adjustCurrentThemeRef = useRef(adjustCurrentTheme)
  const qc = useContext(QueryClientContext)

  useEffect(() => {
    applyThemeByIdRef.current = applyThemeById
  }, [applyThemeById])

  useEffect(() => {
    adjustCurrentThemeRef.current = adjustCurrentTheme
  }, [adjustCurrentTheme])

  // Set theme props in context
  useEffect(() => {
    setThemeProps({
      currentThemeColors: Object.entries(theme?.vars || {}).map(([key, val]) => ({
        colorName: key,
        color: val,
      })),
      currentThemeName: theme?.name || "Undefined",
      onColorChange: (colorValue, colorName) => {
        adjustCurrentThemeRef.current({ [colorName]: colorValue })
        toast({
          description: `Changed: ${colorName} to ${colorValue}`,
          title: "Updated color",
        })
      },
      themes: themesList || [],
      currentThemeId: theme?.id ?? null,
      onSelectTheme: async (t) => {
        await applyThemeByIdRef.current(t.id)
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
  }, [theme, themesList, setThemeProps])

  const createNewThemeFromTheme = async (
    name: string,
    animations: Record<string, unknown>,
    vars: Record<string, string>
  ) => {
    await addNewTheme(name, animations, vars)
    await sleep(10) // allow backend to settle
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
