import type { CreateRepoType, DockStatConfigTableType } from "@dockstat/typings/types"

export const defaultConfig: DockStatConfigTableType = {
  id: 0,
  name: "DockStat",
  version: "1.0.0",
  allow_untrusted_repo: false,
  default_themes: {
    // Themes will be split in dark and white packs => each their own array, and 0 has to be dockstat default
    dark: 0,
    light: 0,
  },
  hotkeys: { "open:quicklinks": "k", "toggle:sidebar": "b" },
  nav_links: [],
  autostart_handlers_monitoring: true,
  config_database_rev: "v1.0.1",
  tables: [],
  keys: { web: null, docker: null, docknode: null },
  addtionalSettings: {
    showBackendRamUsageInNavbar: true,
  },
}

export const defaultRepositories: CreateRepoType[] = [
  {
    name: "DockStore",
    source: "its4nik/dockstat:dev/apps/dockstore",
    type: "github",
    policy: "strict",
    verification_api: "http://localhost:4444",
  },
]
