import type { PluginActions } from "@dockstat/typings"
import type { DockMonTable } from "./types"

const DockMonActions: PluginActions<DockMonTable> = {
  getAllMetrics: ({ table }) => table?.select(["*"]).all(),
  getContainerMetrics: ({ table }) => table?.select(["*"]).where({ type: "CONTAINER" }).all(),
  getHostMetrics: ({ table }) => table?.select(["*"]).where({ type: "HOST" }).all(),
  test1: () => {
    return "Test1"
  },
  test2: ({ previousAction }) => {
    return `${previousAction} - Test2`
  },
}

export default DockMonActions
