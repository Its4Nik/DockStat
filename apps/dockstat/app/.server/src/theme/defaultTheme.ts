import type { THEME } from "@dockstat/typings";

export const DockStat_dark: THEME.ThemeTable = {
  creator: "https://github.com/Its4Nik",
  license: "MIT",
  name: "DockStat Dark",
  vars: {
    "primary-text": "white",
    "secondary-text": "gray",
    "tertiary-text": "lightgray",
    "accent": "#007bff",
    "border-color": "#333",
    "border-width": "1px"
  },
  config: {
    bg: {
      useEffect: true,
      colors: [],
      effect: "aurora"
    }
  }
} as const;
