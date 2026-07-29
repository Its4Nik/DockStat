import type { ReactNode } from "react"
import { EdenContext } from "./EdenContext"
import type { Client } from "./index"

export type EdenProviderProps = {
  children: ReactNode
  client: Client
}

export function EdenProvider({ children, client }: EdenProviderProps) {
  return <EdenContext.Provider value={client}>{children}</EdenContext.Provider>
}
