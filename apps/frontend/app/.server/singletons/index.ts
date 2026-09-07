import { Auth as AuthObj } from "./auth"
import { DockStatDB } from "./db"
import { DCM } from "./docker"
import { DNH } from "./docknodes"
import { PluginHandler } from "./pluginHandler"
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
}

export { Singletons }
export default Singletons
