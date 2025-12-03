import Elysia, { t } from "elysia"
import DCM from "../../docker"

export const DockerContainerElysia = new Elysia({
	prefix: "/containers",
	detail: {
		tags: ["Docker Containers"],
	},
}).get(
	"/all/:clientId",
	async ({ params: { clientId } }) => await DCM.getAllContainers(clientId),
	{
		params: t.Object({
			clientId: t.Number(),
		}),
	}
)
