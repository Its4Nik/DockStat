import Elysia from "elysia"
import DockStatElysiaPlugins from "./elysia-plugins"
import { errorHandler } from "./handlers/onError"
import MetricsMiddleware from "./middleware/metrics"
import DBRoutes from "./routes/db"
import DockerRoutes from "./routes/docker"
import DockStatMiscRoutes from "./routes/misc"
import PluginRoutes from "./routes/plugins"
import StatusRoutes from "./routes/status"
import BaseLogger from "./logger"
import RepositoryRoutes from "./routes/repositories"

const PORT = Bun.env.DOCKSTATAPI_PORT || 3030

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
  .listen(PORT)

BaseLogger.info(
  `

    ██████████                     █████       █████████   █████               █████         █████████   ███████████  █████
   ░░███░░░░███                   ░░███       ███░░░░░███ ░░███               ░░███         ███░░░░░███ ░░███░░░░░███░░███
    ░███   ░░███  ██████   ██████  ░███ █████░███    ░░░  ███████    ██████   ███████      ░███    ░███  ░███    ░███ ░███
    ░███    ░███ ███░░███ ███░░███ ░███░░███ ░░█████████ ░░░███░    ░░░░░███ ░░░███░       ░███████████  ░██████████  ░███
    ░███    ░███░███ ░███░███ ░░░  ░██████░   ░░░░░░░░███  ░███      ███████   ░███        ░███░░░░░███  ░███░░░░░░   ░███
    ░███    ███ ░███ ░███░███  ███ ░███░░███  ███    ░███  ░███ ███ ███░░███   ░███ ███    ░███    ░███  ░███         ░███
    ██████████  ░░██████ ░░██████  ████ █████░░█████████   ░░█████ ░░████████  ░░█████     █████   █████ █████        █████
   ░░░░░░░░░░    ░░░░░░   ░░░░░░  ░░░░ ░░░░░  ░░░░░░░░░     ░░░░░   ░░░░░░░░    ░░░░░     ░░░░░   ░░░░░ ░░░░░        ░░░░░

  - API running at http://localhost:${PORT}/api/v2
  - API-Docs at: http://localhost:${PORT}/api/v2/docs
  - DockStat Docs at: https://dockstat.itsnik.de
  `
)

export type TreatyType = typeof DockStatAPI
