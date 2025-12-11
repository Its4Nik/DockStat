import Elysia from "elysia"
import DockStatElysiaPlugins from "./elysia-plugins"
import DBRoutes from "./routes/db"
import PrometheusMetricsRoute from "./routes/metrics/prometheus"
import DockerRoutes from "./routes/docker"
import PluginRoutes from "./routes/plugins"
import { errorHandler } from "./handlers/onError"
import { cors } from "@elysiajs/cors"

export const DockStatAPI = new Elysia({ prefix: "/api/v2" })
  .use(cors())
  .use(DockStatElysiaPlugins)
  .use(errorHandler)
  .use(DBRoutes)
  .use(PrometheusMetricsRoute)
  .use(DockerRoutes)
  .use(PluginRoutes)

export type TreatyType = typeof DockStatAPI
