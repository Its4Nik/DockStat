import Elysia from "elysia"
import DockStatElysiaPlugins from "./elysia-plugins"
import { errorHandler } from "./handlers/onError"
import MetricsMiddleware from "./middleware/metrics"
import DBRoutes from "./routes/db"
import DockerRoutes from "./routes/docker"
import DockStatMiscRoutes from "./routes/misc"
import PluginRoutes from "./routes/plugins"
import StatusRoutes from "./routes/status"
import RepositoryRoutes from "./routes/repositories"

export const DockStatAPI = new Elysia({ prefix: "/api/v2" })
  .use(MetricsMiddleware)
  .use(DockStatElysiaPlugins)
  .use(errorHandler)
  .use(StatusRoutes)
  .use(DBRoutes)
  .use(DockerRoutes)
  .use(PluginRoutes)
  .use(DockStatMiscRoutes)
  .use(RepositoryRoutes)

export type TreatyType = typeof DockStatAPI
