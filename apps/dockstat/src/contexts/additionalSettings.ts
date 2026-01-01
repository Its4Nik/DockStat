import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { createContext } from "react"

export const AdditionalSettingsContext = createContext<
  DockStatConfigTableType["addtionalSettings"]
>({})
