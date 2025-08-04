import type Docker from "dockerode";
import { dbFunctions } from "~/core/database";
import { getDockerClient } from "~/core/docker/client";
import {
	calcRate,
	calculateCpuPercent,
	calculateMemoryUsage,
	sumNetworkBytes,
} from "~/core/utils/calculations";
import type { container_stats } from "~/typings/database";
import { logger } from "../utils/logger";

async function storeContainerData() {
	const hosts = dbFunctions.getDockerHosts();
	logger.debug("Retrieved docker hosts");

	await Promise.all(
		hosts.map(async (host) => {
			const docker = getDockerClient(host);
			await docker.ping();

			const containers = await docker.listContainers({ all: true });
			await Promise.all(
				containers.map(async (info) => {
					const container = docker.getContainer(info.Id);
					const rawStats: Docker.ContainerStats = await new Promise(
						(res, rej) =>
							container.stats({ stream: false }, (err, stats) =>
								err ? rej(err) : res(stats as Docker.ContainerStats),
							),
					);

					const now = new Date();

					const cpu_usage = calculateCpuPercent(rawStats);
					const memory_usage = calculateMemoryUsage(rawStats);

					const { rx: network_rx_bytes, tx: network_tx_bytes } =
						sumNetworkBytes(rawStats);

					const prev = dbFunctions.getLastContainerStats(host.id, info.Id);

					let network_rx_rate: number | null = null;
					let network_tx_rate: number | null = null;
					if (prev) {
						logger.debug(`Loaded previous data: ${JSON.stringify(prev)}`);
						network_rx_rate = calcRate(
							prev.network_rx_bytes,
							prev.timestamp || new Date().toISOString(),
							network_rx_bytes,
							now,
						);
						network_tx_rate = calcRate(
							prev.network_tx_bytes,
							prev.timestamp || new Date().toISOString(),
							network_tx_bytes,
							now,
						);
					}

					const parsed: container_stats = {
						id: info.Id,
						hostId: host.id,
						name: info.Names[0].replace(/^\//, ""),
						image: info.Image,
						state: info.State,
						status: info.Status,
						cpu_usage,
						memory_usage,
						network_rx_bytes,
						network_tx_bytes,
						network_rx_rate: network_rx_rate || 0,
						network_tx_rate: network_tx_rate || 0,
						timestamp: now.toISOString(),
					};

					dbFunctions.addContainerStats(parsed);
				}),
			);
		}),
	);
}

export default storeContainerData;
