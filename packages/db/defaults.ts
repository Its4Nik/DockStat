import type { CreateRepoType, DockStatConfigTableType } from "@dockstat/typings/types"

export const defaultConfig: DockStatConfigTableType = {
  additionalSettings: {
    defaultDashboard: undefined,
    showBackendRamUsageInNavbar: true,
  },
  allow_untrusted_repo: false,
  autostart_handlers_monitoring: true,
  config_database_rev: "v1.0.1",
  default_themes: {
    // Themes will be split in dark and white packs => each their own array, and 0 has to be dockstat default
    dark: 0,
    light: 0,
  },
  hotkeys: {
    "close:sidebar": "",
    "close:themeEditor": "",
    "open:quicklinks": "k",
    "open:sidebar": "",
    "open:themeEditor": "",
    "toggle:sidebar": "b",
    "toggle:themeEditor": "p",
  },
  id: 0,
  keys: { docker: null, docknode: null, web: null },
  name: "DockStat",
  nav_links: [],
  tables: [],
  version: "1.0.0",
}

export const defaultRepositories: CreateRepoType[] = [
  {
    name: "DockStore",
    policy: "strict",
    source: "its4nik/dockstat:dev/apps/dockstore",
    type: "github",
    verification_api: "http://localhost:4444",
  },
]
