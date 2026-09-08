/**
 * Server-side data loaders, exposed with React Router loader signatures so
 * route modules can delegate directly:
 *
 *   import { Loaders } from "~/.server/loader"
 *   export const loader = Loaders.Widgets.listDashboards
 *
 * Every member receives `{ request, params }` and returns loader-ready data.
 */

import { createThemeHandler, type themeType } from "@dockstat/theme-handler/server"
import { NODE_TEMPLATES } from "@dockstat/widgets/server"
import { configCache, dockerCache, repoCache, statusCache } from "../cache"
import { fail, ok, query, type RouteArgs } from "../lib/http"
import { BaseLogger } from "../logger"
import Singletons from "../singletons"
import { DockStatDB } from "../singletons/db"
import { AuthLoaders } from "./auth"
import { CertLoaders } from "./certs"
import { DbLoaders } from "./db"
import { DockerLoaders } from "./docker"
import { GraphLoaders } from "./graph"
import { MiscLoaders } from "./misc"
import { PluginsLoaders } from "./plugins"
import { RepoLoaders } from "./repo"
import { StatusLoaders } from "./status"
import { SystemLoaders } from "./system"
import { ThemeLoaders } from "./themes"
import { WidgetLoaders } from "./widgets"

export const Loaders = {
  Auth: AuthLoaders,
  Certificates: CertLoaders,
  DB: DbLoaders,
  Docker: DockerLoaders,
  Graph: GraphLoaders,
  Misc: MiscLoaders,
  Plugins: PluginsLoaders,
  Repositories: RepoLoaders,
  Status: StatusLoaders,
  System: SystemLoaders,
  Themes: ThemeLoaders,
  Widgets: WidgetLoaders
} as const

export type Loaders = typeof Loaders
export default Loaders
