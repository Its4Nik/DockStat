import type { DockStatConfigTableType } from "@dockstat/typings/types"

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
  hotkeys: {},
  nav_links: [],
  registered_repos: [
    {
      name: "DockStore",
      source: "its4nik/dockstat:dev/apps/dockstore",
      type: "github",
      // verification is not implemented yet :(
      isVerified: true,
      policy: "strict",
      verification_api: "https://api.itsnik.de/dockstacks/_verify",
      hashes: null,
    },
  ],
  autostart_handlers_monitoring: true,
  config_database_rev: "v1.0.0",
  tables: [],
  tls_certs_and_keys: { web: null, docker: null },
}
