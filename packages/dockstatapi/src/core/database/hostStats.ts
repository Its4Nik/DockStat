import type { HostStats } from "~/typings/docker";
import { db } from "./database";
import { executeDbOperation } from "./helper";

const insert = db.prepare(`
  INSERT INTO host_stats (
    hostId, hostName, dockerVersion, apiVersion, os, architecture,
    totalMemory, totalCPU, labels, containers, containersRunning,
    containersStopped, containersPaused, images
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectStmt = db.prepare(`
  SELECT *
  FROM host_stats
`);

export function addHostStats(stats: HostStats) {
	return executeDbOperation(
		"Update Host Stats",
		() =>
			insert.run(
				stats.hostId,
				stats.hostName,
				stats.dockerVersion,
				stats.apiVersion,
				stats.os,
				stats.architecture,
				stats.totalMemory,
				stats.totalCPU,
				JSON.stringify(stats.labels),
				stats.containers,
				stats.containersRunning,
				stats.containersStopped,
				stats.containersPaused,
				stats.images,
			),
		() => {
			if (
				typeof stats.hostId !== "number" ||
				typeof stats.hostName !== "string" ||
				typeof stats.dockerVersion !== "string" ||
				typeof stats.apiVersion !== "string" ||
				typeof stats.os !== "string" ||
				typeof stats.architecture !== "string" ||
				typeof stats.totalMemory !== "number" ||
				typeof stats.totalCPU !== "number" ||
				typeof JSON.stringify(stats.labels) !== "string" ||
				typeof stats.containers !== "number" ||
				typeof stats.containersRunning !== "number" ||
				typeof stats.containersStopped !== "number" ||
				typeof stats.containersPaused !== "number" ||
				typeof stats.images !== "number"
			) {
				throw new TypeError(`Invalid Host Stats! - ${stats}`);
			}
		},
	);
}

export function getHostStats(): HostStats[] {
	return executeDbOperation("Get Host Stats", () =>
		selectStmt.all(),
	) as HostStats[];
}
