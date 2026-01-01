import { createFrontendRoutes } from "@dockstat/plugin-builder"
import { ContainersRoute } from "./containers"
import { DashboardRoute } from "./dashboard"
import { HostsRoute } from "./hosts"

const DockMonFrontend = createFrontendRoutes([DashboardRoute, HostsRoute, ContainersRoute])

export default DockMonFrontend
