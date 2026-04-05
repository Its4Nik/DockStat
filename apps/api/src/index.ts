import Elysia from "elysia"
import DockStatElysiaPlugins from "./elysia-plugins"
import { errorHandler } from "./handlers/onError"
import RequestLogger from "./handlers/requestLogger"
import BaseLogger from "./logger"
import MetricsMiddleware from "./middleware/metrics"
import DBRoutes from "./routes/db"
import DockerRoutes from "./routes/docker"
import GraphRoutes from "./routes/graph"
import DockStatMiscRoutes from "./routes/misc"
import { DockNodeElyisa } from "./routes/node"
import PluginRoutes from "./routes/plugins"
import RepositoryRoutes from "./routes/repositories"
import StatusRoutes from "./routes/status"
import ThemeRoutes from "./routes/themes"
import DockStatWebsockets from "./websockets"

const PORT = Bun.env.DOCKSTATAPI_PORT || 3030

export const DockStatAPI = new Elysia({ prefix: "/api/v2", precompile: true })
  .use(RequestLogger)
  .use(MetricsMiddleware)
  .use(DockStatElysiaPlugins)
  .use(errorHandler)
  .use(StatusRoutes)
  .use(DBRoutes)
  .use(DockerRoutes)
  .use(PluginRoutes)
  .use(DockStatMiscRoutes)
  .use(RepositoryRoutes)
  .use(ThemeRoutes)
  .use(DockStatWebsockets)
  .use(DockNodeElyisa)
  .use(GraphRoutes)
  .listen(PORT)

const hostnameAndPort = `${DockStatAPI.server?.hostname}:${DockStatAPI.server?.port}`

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

  - API running at ${hostnameAndPort}/api/v2
  - API-Docs at: ${hostnameAndPort}/api/v2/docs
  - DockStat Docs at: https://dockstat.itsnik.de
  `
)

export type TreatyType = typeof DockStatAPI
