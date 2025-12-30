import { createApiRoutes } from "@dockstat/plugin-builder"
import type DockMonActions from "../../actions"
import type { DockMonTable } from "../../types"

const DockMonApiRoutes = createApiRoutes<DockMonTable, typeof DockMonActions>({
  "/all": {
    actions: [""],
    method: "GET",
  },
})

export default DockMonApiRoutes
