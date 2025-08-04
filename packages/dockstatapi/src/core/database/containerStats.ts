import type { container_stats } from "~/typings/database";
import { db } from "./database";
import { executeDbOperation } from "./helper";

const insert = db.prepare(`
  INSERT INTO container_stats (
    id,
    hostId,
    name,
    image,
    status,
    state,
    cpu_usage,
    memory_usage,
    network_rx_rate,
    network_tx_rate,
    network_rx_bytes,
    network_tx_bytes,
    timestamp
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getOne = db.prepare(`
  SELECT *
    FROM container_stats
   WHERE hostId = ?
     AND id     = ?
ORDER BY timestamp DESC
   LIMIT 1
`);

const getAll = db.prepare(`
  SELECT *
    FROM container_stats
`);

export function addContainerStats(stats: container_stats) {
	return executeDbOperation(
		"Add Container Stats",
		() =>
			insert.run(
				stats.id,
				stats.hostId,
				stats.name,
				stats.image,
				stats.status,
				stats.state,
				stats.cpu_usage,
				stats.memory_usage || 0,
				stats.network_rx_rate,
				stats.network_tx_rate,
				stats.network_rx_bytes,
				stats.network_tx_bytes,
				stats.timestamp || new Date().toISOString(),
			),
		() => {
			if (
				typeof stats.id !== "string" ||
				typeof stats.hostId !== "number" ||
				typeof stats.name !== "string" ||
				typeof stats.image !== "string" ||
				typeof stats.status !== "string" ||
				typeof stats.state !== "string" ||
				typeof stats.cpu_usage !== "number" ||
				typeof stats.memory_usage !== "number" ||
				typeof stats.network_rx_rate !== "number" ||
				typeof stats.network_tx_rate !== "number" ||
				typeof stats.network_rx_bytes !== "number" ||
				typeof stats.network_tx_bytes !== "number"
			) {
				throw new TypeError("Invalid container stats parameters");
			}
		},
	);
}

export function getContainerStats(): container_stats[] {
	return executeDbOperation("Get All Container Stats", () =>
		getAll.all(),
	) as container_stats[];
}

export function getLastContainerStats(
	hostId: number,
	containerId: string,
): container_stats | undefined {
	return executeDbOperation(
		"Get Last Container Stat",
		() => getOne.get(hostId, containerId) as container_stats,
	);
}
