import DockerClientManager from "@dockstat/docker-client/manager"
import { DockStatDB } from "../database"
import BaseLogger from "../logger"
import PluginHandler from "../plugins"

const DCM = new DockerClientManager(DockStatDB._sqliteWrapper, PluginHandler, BaseLogger, {
  maxWorkers: Number(Bun.env.DOCKSTAT_MAX_WORKERS || 200),
})

export default DCM
