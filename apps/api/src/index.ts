import Elysia from "elysia"
import { AuthHandler, authenticated, Middleware } from "./auth"
import DockStatElysiaPlugins from "./elysia-plugins"
import { errorHandler } from "./handlers/onError"
import CreateRequestLogger, { stateMap } from "./handlers/requestLogger"
import BaseLogger from "./logger"
import MetricsMiddleware from "./middleware/metrics"
import CertificateRoutes from "./routes/certificates"
import DBRoutes from "./routes/db/index"
import DockerRoutes from "./routes/docker"
import GraphRoutes from "./routes/graph"
import DockStatMiscRoutes from "./routes/misc"
import PluginRoutes from "./routes/plugins"
import RepositoryRoutes from "./routes/repositories"
import StatusRoutes from "./routes/status"
import ThemeRoutes from "./routes/themes"
import { DSWebSockerHandler, WsTopicsRoutes } from "./websockets"
import { WidgetsService } from "./widget"

const PORT = Bun.env.DOCKSTATAPI_PORT || 3030

export const DockStatAPI = new Elysia({ precompile: false, prefix: "/api/v2", name: "DockStat-API" })
  .use(errorHandler)
  .use(Middleware)
  .use(DockStatElysiaPlugins)
  .use(CreateRequestLogger())
  // WebSocket routes must be OUTSIDE the authenticated guard because
  // Elysia's HTTP-level guard/beforeHandle does not work for WS upgrades.
  // The WS handlers authenticate via their own requireAuth config.
  .use(DSWebSockerHandler.getRoutes())
  .use(WidgetsService.getWsRoutes())
  .guard(
    authenticated(() => stateMap),
    (app) => {
      return (
        app
          .use(MetricsMiddleware)
          .use(StatusRoutes)
          .use(DBRoutes)
          .use(CertificateRoutes)
          .use(DockerRoutes)
          .use(PluginRoutes)
          .use(DockStatMiscRoutes)
          .use(RepositoryRoutes)
          .use(ThemeRoutes)
          .use(WsTopicsRoutes)
          .use(WidgetsService.getRestRoutes())
          //.use(DockNodeElyisa)
          .use(GraphRoutes)
      )
    }
  )
  .use(AuthHandler.getRoutes())
  .listen(PORT)

export type TreatyType = typeof DockStatAPI

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
  - Allow guest registration: ${AuthHandler.getAllowGuestRegistration()} (${AuthHandler.users.select(["id"]).count()} User)
  `
)
