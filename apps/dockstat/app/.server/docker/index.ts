import DockerClientManager from "@dockstat/docker-client/manager"
import { DockStatDB } from "../db"
import { PluginHandler } from "../api/plugins"

const DCM = new DockerClientManager(DockStatDB._sqliteWrapper, {
	maxWorkers: 200,
	events: PluginHandler.getHookHandlers(),
})

export default DCM
