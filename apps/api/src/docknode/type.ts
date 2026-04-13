import type { DockStatConfigTableType } from "@dockstat/typings/types"

export type DockNodeTable = {
  id?: number
  name: string
  host: string
  port: number
  useSSL: boolean
  timeout: number
  keys: DockStatConfigTableType["keys"]
}
