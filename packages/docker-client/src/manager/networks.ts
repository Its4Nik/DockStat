import { DockerClientManagerCore } from "./core"

export class Networks extends DockerClientManagerCore {
	public async getNetworks(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: "getNetworks",
			hostId,
		})
	}
}
