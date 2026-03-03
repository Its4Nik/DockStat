import type { ThemeBrowserItem } from "@dockstat/ui";
import { sleep } from "@dockstat/utils";
import { useContext, useEffect, useRef } from "react";
import { QueryClientContext } from "@/contexts/queryClient";
import { useThemeSidebar } from "@/contexts/ThemeSidebarContext";
import { useThemeSidebarUI } from "@/contexts/ThemeSidebarUIContext";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/lib/toast";

export function useThemeManager() {
  const { addNewTheme } = useThemeSidebar();
  const { isThemeSidebarOpen, setIsThemeSidebarOpen } = useThemeSidebarUI();
  const { theme, themesList, applyThemeById, adjustCurrentTheme } = useTheme();

  const applyThemeByIdRef = useRef(applyThemeById);
  const adjustCurrentThemeRef = useRef(adjustCurrentTheme);
  const qc = useContext(QueryClientContext);

  useEffect(() => {
    applyThemeByIdRef.current = applyThemeById;
  }, [applyThemeById]);

  useEffect(() => {
    adjustCurrentThemeRef.current = adjustCurrentTheme;
  }, [adjustCurrentTheme]);

  const currentThemeColors = Object.entries(theme?.vars || {}).map(
    ([key, val]) => ({
      colorName: key,
      color: val,
    }),
  );

  const currentThemeName = theme?.name || "Undefined";
  const currentThemeId = theme?.id ?? null;
  const themes = themesList || [];

  const onColorChange = (colorValue: string, colorName: string) => {
    adjustCurrentThemeRef.current({ [colorName]: colorValue });
    toast({
      description: `Changed: ${colorName} to ${colorValue}`,
      title: "Updated color",
    });
  };

  const onSelectTheme = async (t: ThemeBrowserItem) => {
    await applyThemeByIdRef.current(t.id);
  };

  const toastSuccess = (themeName: string) => {
    toast({
      description: `Set ${themeName} active`,
      title: "Updated Theme Preference",
      variant: "success",
    });
  };

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
  };
}
