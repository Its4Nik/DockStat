import { createFrontendRoutes } from "@dockstat/plugin-builder";
import { DashboardRoute } from "./dashboard";
import { HostsRoute } from "./hosts";
import { ContainersRoute } from "./containers";

const DockMonFrontend = createFrontendRoutes([
	DashboardRoute,
	HostsRoute,
	ContainersRoute,
]);

export default DockMonFrontend;
