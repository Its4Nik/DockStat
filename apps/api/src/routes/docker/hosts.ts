import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"

export const DockerHostElysia = new Elysia({
	prefix: "/hosts",
	detail: {
		tags: ["Docker Host Management"],
	},
})
	.get("/", async ({ status }) => status(200, await DCM.getAllHosts()), {
		response: { 200: DockerModel.allHosts },
	})
	.get(
		"/:clientId",
		async ({ params: { clientId } }) => await DCM.getAllHostMetrics(clientId),
		{
			params: t.Object({
				clientId: t.Number(),
			}),
		}
	)
	.post(
		"/add",
		async ({ body }) =>
			await DCM.addHost(
				body.clientId,
				body.hostname,
				body.name,
				body.secure,
				body.port
			),
		{
			body: DockerModel.addHostBody,
		}
	)
	.post(
		"/update",
		async ({ body: { clientId, host } }) =>
			await DCM.updateHost(clientId, {
				...host,
				docker_client_id: clientId,
			}),
		{
			body: DockerModel.updateBody,
		}
	)
