import Elysia from "elysia"
import { LogWebsoket } from "./logSocket"
import { RssSocket } from "./rssSocket"

const DockStatWebsockets = new Elysia({ prefix: "/ws" }).use(LogWebsoket).use(RssSocket)
export default DockStatWebsockets
