import Elysia from "elysia"
import DockStatElysiaPlugins from "./elysia-plugins"
import { errorHandler } from "./handlers/onError"
import MetricsMiddleware from "./middleware/metrics"
import DBRoutes from "./routes/db"
import DockerRoutes from "./routes/docker"
import DockStatMiscRoutes from "./routes/misc"
import PluginRoutes from "./routes/plugins"
import StatusRoutes from "./routes/status"

export const DockStatAPI = new Elysia({ prefix: "/api/v2" })
  .use(MetricsMiddleware)
  .use(DockStatElysiaPlugins)
  .use(errorHandler)
  .use(StatusRoutes)
  .use(DBRoutes)
  .use(DockerRoutes)
  .use(PluginRoutes)
  .use(DockStatMiscRoutes)

if (require.main === module) {
  const PORT =
    Bun.env.DOCKSTAT_API_PORT || (Bun.env.NODE_ENV || "dev") === "production" ? 3000 : 5173

  DockStatAPI.listen(PORT)
  console.log(`DockStatAPI listening on ${PORT}`)
}

export type TreatyType = typeof DockStatAPI
