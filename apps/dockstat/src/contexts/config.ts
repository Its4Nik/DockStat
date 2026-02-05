import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { createContext } from "react"

export type ConfigProviderData = {
  additionalSettings?: DockStatConfigTableType["addtionalSettings"]
  navLinks?: DockStatConfigTableType["nav_links"]
  hotkeys?: DockStatConfigTableType["hotkeys"]
}

export const ConfigProviderContext = createContext<ConfigProviderData>({})
