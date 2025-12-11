import { cors } from "@elysiajs/cors"
import Elysia from "elysia"
import DockStatElysiaPlugins from "./elysia-plugins"
import { errorHandler } from "./handlers/onError"
import DBRoutes from "./routes/db"
import DockerRoutes from "./routes/docker"
import PrometheusMetricsRoute from "./routes/metrics/prometheus"
import PluginRoutes from "./routes/plugins"

export const DockStatAPI = new Elysia({ prefix: "/api/v2" })
  .use(cors())
  .use(DockStatElysiaPlugins)
  .use(errorHandler)
  .use(DBRoutes)
  .use(PrometheusMetricsRoute)
  .use(DockerRoutes)
  .use(PluginRoutes)

export type TreatyType = typeof DockStatAPI
