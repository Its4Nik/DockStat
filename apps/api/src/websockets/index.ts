import Elysia from "elysia"
import { LogWebsoket } from "./logSocket"
import { RssSocket } from "./rssSocket"
import WebSocketHandler from "./handler";
import BaseLogger from "../logger";

const log = BaseLogger

export const DSWebSockerHandler = new WebSocketHandler(log.spawn("WS-Handler"))

const DockStatWebsockets = new Elysia({ prefix: "/ws" }).use(LogWebsoket).use(RssSocket)
export default DockStatWebsockets
