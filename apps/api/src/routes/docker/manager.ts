import Elysia from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"

export const DockerManager = new Elysia({
	prefix: "/manager",
	detail: {
		tags: ["Docker Manager"],
	},
})
	.get(
		"/pool-stats",
		async ({ status }) => {
			try {
				const res = await DCM.getPoolMetrics()
				return status(200, res)
			} catch (error) {
				return status(400, {
					error: error,
					message: "Could not get Pool Stats",
				})
			}
		},
		{
			response: { 200: DockerModel.poolStatus, 400: DockerModel.error },
		}
	)
	.post(
		"/init-all-clients",
		({ status }) => {
			const allClients = DCM.getAllClients()
			for (const c of allClients) {
				DCM.init(c.id)
			}
			return status(200, DCM.getAllClients(true))
		},
		{
			response: { 200: DockerModel.initAllClientsRes },
		}
	)
