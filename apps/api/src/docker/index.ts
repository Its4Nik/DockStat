import DockerClientManager from "@dockstat/docker-client/manager"
import { DockStatDB } from "../database"
import PluginHandler from "../plugins"
import BaseLogger from "../logger"

const DCM = new DockerClientManager(DockStatDB._sqliteWrapper, PluginHandler, BaseLogger, {
  maxWorkers: Number(Bun.env.DOCKSTAT_MAX_WORKERS) || 200,
})

export default DCM
