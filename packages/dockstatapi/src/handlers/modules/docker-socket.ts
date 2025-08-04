import { serve } from "bun";
import split2 from "split2";
import { dbFunctions } from "~/core/database";
import { getDockerClient } from "~/core/docker/client";
import {
	calculateCpuPercent,
	calculateMemoryUsage,
} from "~/core/utils/calculations";
import { logger } from "~/core/utils/logger";
import type { log_message } from "~/typings/database";
import type { DockerHost } from "~/typings/docker";
import type { WSMessage } from "~/typings/websocket";
import { createLogStream } from "./logs-socket";

// Unified WebSocket message with topic for client-side routing
const clients = new Set<Bun.ServerWebSocket<unknown>>();

/**
 * Broadcasts a WSMessage to all connected clients.
 */
export function broadcast(wsMsg: WSMessage) {
	const payload = JSON.stringify(wsMsg);
	for (const ws of clients) {
		if (ws.readyState === 1) {
			ws.send(payload);
		}
	}
}

/**
 * Streams Docker stats for all hosts and broadcasts events.
 */
export async function startDockerStatsBroadcast() {
	logger.debug("Starting Docker stats broadcast...");

	try {
		const hosts: DockerHost[] = dbFunctions.getDockerHosts();
		logger.debug(`Retrieved ${hosts.length} Docker host(s)`);

		for (const host of hosts) {
			try {
				const docker = getDockerClient(host);
				await docker.ping();

				const containers = await docker.listContainers({ all: true });
				logger.debug(
					`Host ${host.name} contains ${containers.length} containers`,
				);

				for (const info of containers) {
					(async () => {
						try {
							const statsStream = await docker
								.getContainer(info.Id)
								.stats({ stream: true });
							const splitter = split2();
							statsStream.pipe(splitter);

							for await (const line of splitter) {
								if (!line) continue;
								try {
									const stats = JSON.parse(line);
									const msg: WSMessage = {
										topic: "stats",
										data: {
											id: info.Id,
											hostId: host.id,
											name: info.Names[0].replace(/^\//, ""),
											image: info.Image,
											status: info.Status,
											state: stats.state || info.State,
											cpuUsage: calculateCpuPercent(stats) ?? 0,
											memoryUsage: calculateMemoryUsage(stats) ?? 0,
										},
									};
									broadcast(msg);
								} catch (err) {
									const errorMsg = (err as Error).message;
									const msg: WSMessage = {
										topic: "error",
										data: {
											hostId: host.id,
											containerId: info.Id,
											error: `Parse error: ${errorMsg}`,
										},
									};
									broadcast(msg);
								}
							}
						} catch (err) {
							const errorMsg = (err as Error).message;
							const msg: WSMessage = {
								topic: "error",
								data: {
									hostId: host.id,
									containerId: info.Id,
									error: `Stats stream error: ${errorMsg}`,
								},
							};
							broadcast(msg);
						}
					})();
				}
			} catch (err) {
				const errorMsg = (err as Error).message;
				const msg: WSMessage = {
					topic: "error",
					data: {
						hostId: host.id,
						error: `Host connection error: ${errorMsg}`,
					},
				};
				broadcast(msg);
			}
		}
	} catch (err) {
		const errorMsg = (err as Error).message;
		const msg: WSMessage = {
			topic: "error",
			data: {
				hostId: 0,
				error: `Initialization error: ${errorMsg}`,
			},
		};
		broadcast(msg);
	}
}

/**
 * Sets up a log stream to forward application logs over WebSocket.
 */
function startLogBroadcast() {
	const logStream = createLogStream();
	logStream.on("data", (chunk: log_message) => {
		const msg: WSMessage = {
			topic: "logs",
			data: chunk,
		};
		broadcast(msg);
	});
}

/**
 * WebSocket server serving multiple topics over one socket.
 */
export const WSServer = serve({
	port: 4837,
	reusePort: true,
	fetch(req, server) {
		//if (req.url.endsWith("/ws")) {
		if (server.upgrade(req)) {
			logger.debug("Upgraded!");
			return;
		}
		//}
		return new Response("Expected WebSocket upgrade", { status: 426 });
	},
	websocket: {
		open(ws) {
			logger.debug("Client connected via WebSocket");
			clients.add(ws);
		},
		message() {},
		close(ws, code, reason) {
			logger.debug(`Client disconnected (${code}): ${reason}`);
			clients.delete(ws);
		},
	},
});

// Initialize broadcasts
startDockerStatsBroadcast().catch((err) => {
	logger.error("Failed to start Docker stats broadcast:", err);
});
startLogBroadcast();
