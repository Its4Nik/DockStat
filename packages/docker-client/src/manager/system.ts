import { DockerClientManagerCore } from "./core"

export class System extends DockerClientManagerCore {
	public async getSystemInfo(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: "getSystemInfo",
			hostId,
		})
	}

	public async getSystemVersion(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: "getSystemVersion",
			hostId,
		})
	}

	public async getDiskUsage(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: "getDiskUsage",
			hostId,
		})
	}

	public async pruneSystem(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: "pruneSystem",
			hostId,
		})
	}
}
