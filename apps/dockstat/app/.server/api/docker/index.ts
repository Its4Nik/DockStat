import Logger from "@dockstat/logger"
import { ElysiaLogger } from "../logger"
import Elysia, { t } from "elysia"
import DCM from "~/.server/docker"
import { DockerAdapterOptionsSchema } from "@dockstat/typings/schemas"

export const logger = new Logger(
	"Docker",
	ElysiaLogger.getParentsForLoggerChaining()
)

const ElysiaDockerInstance = new Elysia({
	prefix: "/docker",
	detail: {
		tags: ["Docker"],
	},
})
	.get("/status", async () => {
		try {
			const status = await DCM.getStatus()
			return status
		} catch (error) {
			logger.error(
				`Failed to get Docker status: ${
					error instanceof Error ? error.message : String(error)
				}`
			)
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			}
		}
	})
	.group(
		"/manager",
		{
			detail: {
				tags: ["Docker Manager"],
			},
		},
		(EDI) =>
			EDI.get("/pool-stats", () => DCM.getPoolMetrics()).post(
				"/init-all-clients",
				() => {
					const allClients = DCM.getAllClients()
					for (const c of allClients) {
						DCM.init(c.id)
					}
					return
				}
			)
	)
	.group(
		"/docker-client",
		{
			detail: {
				tags: ["Docker Client Management"],
			},
		},
		(EDI) =>
			EDI.post(
				"/register",
				({ body }) =>
					DCM.registerClient(body.clientName, body.options || undefined),
				{
					body: t.Object({
						clientName: t.String(),
						options: t.Nullable(DockerAdapterOptionsSchema),
					}),
				}
			)
				.delete("/delete", ({ body }) => DCM.removeClient(body.clientId), {
					body: t.Object({
						clientId: t.Number(),
					}),
				})
				.get("/all/:stored", ({ params }) => DCM.getAllClients(params.stored), {
					params: t.Object({ stored: t.Boolean({ default: false }) }),
				})
				.post(
					"/monitoring/:clientId/start",
					({ params }) => DCM.startMonitoring(params.clientId),
					{
						params: t.Object({
							clientId: t.Number(),
						}),
					}
				)
				.post(
					"/monitoring/:clientId/stop",
					({ params }) => DCM.stopMonitoring(params.clientId),
					{
						params: t.Object({
							clientId: t.Number(),
						}),
					}
				)
	)
	.group(
		"/hosts",
		{
			detail: {
				tags: ["Docker Host Management"],
			},
		},
		(EDI) =>
			EDI.get("/", async () => await DCM.getAllHosts())
				.get(
					"/:clientId",
					async ({ params: { clientId } }) =>
						await DCM.getAllHostMetrics(clientId),
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
						body: t.Object({
							clientId: t.Number(),
							hostname: t.String(),
							name: t.String(),
							secure: t.Boolean(),
							port: t.Number(),
						}),
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
						body: t.Object({
							clientId: t.Number(),
							host: t.Object({
								id: t.Number(),
								host: t.String(),
								name: t.String(),
								secure: t.Boolean(),
								port: t.Number(),
							}),
						}),
					}
				)
	)

	.group(
		"/container",
		{
			detail: {
				tags: ["Docker Containers"],
			},
		},
		(EDI) =>
			EDI.get(
				"/all/:clientId",
				async ({ params: { clientId } }) =>
					await DCM.getAllContainers(clientId),
				{
					params: t.Object({
						clientId: t.Number(),
					}),
				}
			)
	)

export default ElysiaDockerInstance
