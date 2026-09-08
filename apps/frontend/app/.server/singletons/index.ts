import { Auth as AuthObj } from "./auth"
import { Certificates } from "./certificates"
import { DockStatDB } from "./db"
import { DCM } from "./docker"
import { DNH } from "./docknodes"
import { PluginHandler } from "./pluginHandler"
import { ThemeHandler } from "./theme"
import { Widgets } from "./widgets"
import { DSWS } from "./wsHandler"

const Singletons = {
  Auth: AuthObj,
  DB: DockStatDB,
  Docker: DCM,
  DockNodes: DNH,
  Plugins: PluginHandler,
  Widgets: Widgets,
  WS: DSWS,
  Cert: Certificates,
  Themes: ThemeHandler
}

export { Singletons }
export default Singletons
