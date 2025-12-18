import Elysia from "elysia"
import DockStatElysiaPlugins from "./elysia-plugins"
import { errorHandler } from "./handlers/onError"
import DBRoutes from "./routes/db"
import DockerRoutes from "./routes/docker"
import PluginRoutes from "./routes/plugins"
import MetricsMiddleware from "./middleware/metrics"
import DockStatMiscRoutes from "./routes/misc"

export const DockStatAPI = new Elysia({ prefix: "/api/v2" })
  .use(MetricsMiddleware)
  .use(DockStatElysiaPlugins)
  .use(errorHandler)
  .use(DBRoutes)
  .use(DockerRoutes)
  .use(PluginRoutes)
  .use(DockStatMiscRoutes)

export type TreatyType = typeof DockStatAPI
