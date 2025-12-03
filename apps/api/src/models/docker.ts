import { DockerAdapterOptionsSchema } from "@dockstat/typings"
import { t } from "elysia"

export namespace DockerModel {
	export const status = t.Object({
		hosts: t.Array(
			t.Object({ name: t.String(), id: t.Integer(), clientId: t.Integer() })
		),
		totalWorkers: t.Integer(),
		activeWorkers: t.Integer(),
		totalHosts: t.Integer(),
		totalClients: t.Integer(),
		averageHostsPerWorker: t.Integer(),
		workers: t.Array(
			t.Object({
				workerId: t.Number(),
				clientId: t.Number(),
				clientName: t.String(),
				hostsManaged: t.Number(),
				activeStreams: t.Number(),
				isMonitoring: t.Boolean(),
				initialized: t.Boolean(),
				memoryUsage: t.Object({
					rss: t.Number(),
					heapTotal: t.Number(),
					heapUsed: t.Number(),
					external: t.Number(),
				}),
				uptime: t.Number(),
			})
		),
	})
	export const error = t.Object({
		message: t.String(),
		error: t.Unknown(),
	})

	export const poolStatus = t.Object({
		totalWorkers: t.Integer(),
		activeWorkers: t.Integer(),
		totalHosts: t.Integer(),
		totalClients: t.Integer(),
		averageHostsPerWorker: t.Integer(),
		workers: t.Array(
			t.Object({
				workerId: t.Number(),
				clientId: t.Number(),
				clientName: t.String(),
				hostsManaged: t.Number(),
				activeStreams: t.Number(),
				isMonitoring: t.Boolean(),
				initialized: t.Boolean(),
				memoryUsage: t.Object({
					rss: t.Number(),
					heapTotal: t.Number(),
					heapUsed: t.Number(),
					external: t.Number(),
				}),
				uptime: t.Number(),
			})
		),
	})

	export const initAllClientsRes = t.Array(
		t.Object({
			id: t.Number(),
			name: t.String(),
			initialized: t.MaybeEmpty(t.Boolean()),
		})
	)

	export const registerClientBody = t.Object({
		clientName: t.String(),
		options: t.Nullable(DockerAdapterOptionsSchema),
	})
	export const registerClientError = t.Object({
		success: t.Boolean(),
		error: t.Unknown(),
		message: t.String(),
	})
	export const registerClientSuccess = t.Object({
		success: t.Boolean(),
		message: t.String(),
		clientId: t.Number(),
	})

	export const allHosts = t.Array(
		t.Object({
			name: t.String(),
			id: t.Number(),
			clientId: t.Number(),
		})
	)

	export const addHostBody = t.Object({
		clientId: t.Number(),
		hostname: t.String(),
		name: t.String(),
		secure: t.Boolean(),
		port: t.Number(),
	})

	export const updateBody = t.Object({
		clientId: t.Number(),
		host: t.Object({
			id: t.Number(),
			host: t.String(),
			name: t.String(),
			secure: t.Boolean(),
			port: t.Number(),
		}),
	})
}
