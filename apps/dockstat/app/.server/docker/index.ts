import { DockerClientManager } from "@dockstat/docker-client/manager"
import { DockStatDB } from "../db"

const DCM = new DockerClientManager(DockStatDB._sqliteWrapper, {
	maxWorkers: 200,
})

export default DCM
