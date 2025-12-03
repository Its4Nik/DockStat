import type { EVENTS } from "@dockstat/typings"
import type { DockMonTable } from "../types"

export function mapFromHostMetricHookToDb(
	hostMetricEvent: Parameters<EVENTS["host:metrics"]>[0]
): Omit<Omit<DockMonTable, "id">, "stored_on"> {
	return {
		container_id: null,
		docker_client_id: hostMetricEvent.docker_client_id,
		host_id: hostMetricEvent.hostId,
		type: "HOST",
		data: { host_metrics: hostMetricEvent.metrics },
	}
}
