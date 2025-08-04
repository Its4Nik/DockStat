import { sleep } from "bun";
import Docker from "dockerode";
import { dbFunctions } from "~/core/database";
import { getDockerClient } from "~/core/docker/client";
import { logger } from "~/core/utils/logger";
import type { DockerHost } from "~/typings/docker";
import type { ContainerInfo } from "~/typings/docker";
import { pluginManager } from "../plugins/plugin-manager";

export async function monitorDockerEvents() {
	let hosts: DockerHost[];

	try {
		hosts = dbFunctions.getDockerHosts();
		logger.debug(
			`Retrieved ${hosts.length} Docker host(s) for event monitoring.`,
		);
	} catch (error: unknown) {
		logger.error(`Error retrieving Docker hosts: ${(error as Error).message}`);
		return;
	}

	for (const host of hosts) {
		await startFor(host);
	}
}

async function startFor(host: DockerHost) {
	const docker = getDockerClient(host);
	try {
		await docker.ping();
		pluginManager.handleHostReachableAgain(host.name);
	} catch (err) {
		logger.warn(`Restarting Stream for ${host.name} in 10 seconds...`);
		pluginManager.handleHostUnreachable(host.name, String(err));
		await sleep(10000);
		startFor(host);
	}

	try {
		const eventsStream = await docker.getEvents();
		logger.debug(`Started events stream for host: ${host.name}`);

		let buffer = "";

		eventsStream.on("data", (chunk: Buffer) => {
			buffer += chunk.toString("utf8");
			const lines = buffer.split(/\r?\n/);

			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.trim() === "") {
					continue;
				}

				//biome-ignore lint/suspicious/noExplicitAny: Unsure what data we are receiving here
				let event: any;
				try {
					event = JSON.parse(line);
				} catch (parseErr) {
					logger.error(
						`Failed to parse event from host ${host.name}: ${String(parseErr)}`,
					);
					continue;
				}

				if (event.Type === "container") {
					const containerInfo: ContainerInfo = {
						id: event.Actor?.ID || event.id || "",
						hostId: host.id,
						name: event.Actor?.Attributes?.name || "",
						image: event.Actor?.Attributes?.image || event.from || "",
						status: event.status || event.Actor?.Attributes?.status || "",
						state: event.Actor?.Attributes?.state || event.Action || "",
						cpuUsage: 0,
						memoryUsage: 0,
					};

					const action = event.Action;
					logger.debug(`Triggering Action [${action}]`);
					switch (action) {
						case "stop":
							pluginManager.handleContainerStop(containerInfo);
							break;
						case "start":
							pluginManager.handleContainerStart(containerInfo);
							break;
						case "die":
							pluginManager.handleContainerDie(containerInfo);
							break;
						case "kill":
							pluginManager.handleContainerKill(containerInfo);
							break;
						case "create":
							pluginManager.handleContainerCreate(containerInfo);
							break;
						case "destroy":
							pluginManager.handleContainerDestroy(containerInfo);
							break;
						case "pause":
							pluginManager.handleContainerPause(containerInfo);
							break;
						case "unpause":
							pluginManager.handleContainerUnpause(containerInfo);
							break;
						case "restart":
							pluginManager.handleContainerRestart(containerInfo);
							break;
						case "update":
							pluginManager.handleContainerUpdate(containerInfo);
							break;
						case "health_status":
							pluginManager.handleContainerHealthStatus(containerInfo);
							break;
						default:
							logger.debug(
								`Unhandled container event "${action}" on host ${host.name}`,
							);
					}
				}
			}
		});

		eventsStream.on("error", async (err: Error) => {
			logger.error(`Events stream error for host ${host.name}: ${err.message}`);
			logger.warn(`Restarting Stream for ${host.name} in 10 seconds...`);
			await sleep(10000);
			startFor(host);
		});

		eventsStream.on("end", () => {
			logger.info(`Events stream ended for host ${host.name}`);
		});
	} catch (streamErr) {
		logger.error(
			`Failed to start events stream for host ${host.name}: ${String(
				streamErr,
			)}`,
		);
	}
}
