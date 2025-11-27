import { DockerClientManagerCore } from "./core"

export class Volumes extends DockerClientManagerCore {
	public async getVolumes(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: "getVolumes",
			hostId,
		})
	}
}
