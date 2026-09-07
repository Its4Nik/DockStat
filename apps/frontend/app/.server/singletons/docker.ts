import DockerClientManager from "@dockstat/docker-client"
import { BaseLogger } from "../logger"
import { DockStatDB } from "./db"
import { PluginHandler } from "./pluginHandler"

const DCM = new DockerClientManager(DockStatDB._sqliteWrapper, PluginHandler, BaseLogger, {
  maxWorkers: Number(Bun.env.DOCKSTAT_MAX_WORKERS || 200),
})

export { DCM }
