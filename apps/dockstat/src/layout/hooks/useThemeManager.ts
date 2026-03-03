import type { ThemeBrowserItem } from "@dockstat/ui";
import { sleep } from "@dockstat/utils";
import { useCallback, useContext } from "react";
import { QueryClientContext } from "@/contexts/queryClient";
import { useThemeSidebar } from "@/contexts/ThemeSidebarContext";
import { useThemeSidebarUI } from "@/contexts/ThemeSidebarUIContext";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/lib/toast";

export function useThemeManager() {
  const { addNewTheme } = useThemeSidebar();
  const { isThemeSidebarOpen, setIsThemeSidebarOpen } = useThemeSidebarUI();
  const { theme, themesList, applyThemeById, adjustCurrentTheme } = useTheme();
  const qc = useContext(QueryClientContext);

  const currentThemeColors = Object.entries(theme?.vars || {}).map(
    ([key, val]) => ({
      colorName: key,
      color: val,
    }),
  );

  const currentThemeName = theme?.name || "Undefined";
  const currentThemeId = theme?.id ?? null;
  const themes = themesList || [];

  // Core theme operations without side effects
  const updateColor = (colorValue: string, colorName: string) => {
    adjustCurrentTheme({ [colorName]: colorValue });
  };

  const selectTheme = useCallback(
    async (t: ThemeBrowserItem) => {
      await applyThemeById(t.id);
    },
    [applyThemeById],
  );

  // Operations with toast notifications
  const onColorChange = (colorValue: string, colorName: string) => {
    updateColor(colorValue, colorName);
    toast({
      description: `Changed: ${colorName} to ${colorValue}`,
      title: "Updated color",
    });
  };

  const onSelectTheme = async (t: ThemeBrowserItem) => {
    await selectTheme(t);
  };

  const notifyThemeSetActive = (themeName: string) => {
    toast({
      description: `Set ${themeName} active`,
      title: "Updated Theme Preference",
      variant: "success",
    });
  };

  // Keep the old name for backward compatibility
  const toastSuccess = notifyThemeSetActive;

  const createNewThemeFromTheme = async (
    name: string,
    animations: Record<string, unknown>,
    vars: Record<string, string>,
  ) => {
    await addNewTheme(name, animations, vars);
    await sleep(10);
    qc.invalidateQueries({ queryKey: ["fetchAllThemes"] });
  };

  return {
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
    updateColor,
    selectTheme,
    notifyThemeSetActive,
  };
}
