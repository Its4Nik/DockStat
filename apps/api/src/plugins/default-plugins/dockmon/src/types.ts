import type { ContainerStatsInfo, HostMetrics } from "@dockstat/typings"

export type DockMonTable = {
	id: number
	type: "CONTAINER" | "HOST"
	host_id: number
	docker_client_id: number
	container_id: string | null
	data: DBMetrics
	stored_on: number
}

export type DBMetrics = {
	host_metrics?: HostMetrics
	container_metrics?: ContainerStatsInfo
}
