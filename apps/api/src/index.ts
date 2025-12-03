import Elysia from "elysia"
import DockStatElysiaPlugins from "./elysia-plugins"
import DBRoutes from "./routes/db"
import PrometheusMetricsRoute from "./routes/metrics/prometheus"
import DockerRoutes from "./routes/docker"
import PluginRoutes from "./routes/plugins"

export const DockStatAPI = new Elysia({ prefix: "/api/v2" })
	.use(DockStatElysiaPlugins)
	.use(DBRoutes)
	.use(PrometheusMetricsRoute)
	.use(DockerRoutes)
	.use(PluginRoutes)
