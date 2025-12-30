import { createApiRoutes } from "@dockstat/plugin-builder"
import type { DockMonTable } from "../../types"
import type DockMonActions from "../../actions"

const DockMonApiRoutes = createApiRoutes<DockMonTable, typeof DockMonActions>({
  "/all": {
    actions: [""],
    method: "GET",
  },
})

export default DockMonApiRoutes
