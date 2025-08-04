import type Docker from "dockerode";
import { dbFunctions } from "~/core/database";
import { getDockerClient } from "~/core/docker/client";
import { logger } from "~/core/utils/logger";
import type { ContainerInfo, DockerHost, HostStats } from "~/typings/docker";
import type { DockerInfo } from "~/typings/dockerode";

class basicDockerHandler {
	async getContainers(): Promise<ContainerInfo[]> {
		try {
			const hosts = dbFunctions.getDockerHosts() as DockerHost[];
			const containers: ContainerInfo[] = [];

			await Promise.all(
				hosts.map(async (host) => {
					try {
						const docker = getDockerClient(host);
						try {
							await docker.ping();
						} catch (pingError) {
							throw new Error(pingError as string);
						}

						const hostContainers = await docker.listContainers({ all: true });

						await Promise.all(
							hostContainers.map(async (containerInfo) => {
								try {
									const container = docker.getContainer(containerInfo.Id);
									const stats = await new Promise<Docker.ContainerStats>(
										(resolve) => {
											container.stats({ stream: false }, (error, stats) => {
												if (error) {
													throw new Error(error as string);
												}
												if (!stats) {
													throw new Error("No stats available");
												}
												resolve(stats);
											});
										},
									);

									containers.push({
										id: containerInfo.Id,
										hostId: host.id,
										name: containerInfo.Names[0].replace(/^\//, ""),
										image: containerInfo.Image,
										status: containerInfo.Status,
										state: containerInfo.State,
										cpuUsage: stats.cpu_stats.system_cpu_usage,
										memoryUsage: stats.memory_stats.usage,
										stats: stats,
										info: containerInfo,
									});
								} catch (containerError) {
									logger.error(
										"Error fetching container stats,",
										containerError,
									);
								}
							}),
						);
						logger.debug(`Fetched stats for ${host.name}`);
					} catch (error) {
						const errMsg =
							error instanceof Error ? error.message : String(error);
						throw new Error(errMsg);
					}
				}),
			);

			logger.debug("Fetched all containers across all hosts");
			return containers;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : String(error);
			throw new Error(errMsg);
		}
	}

	async getHostStats() {
		//if (true) {
		try {
			const hosts = dbFunctions.getDockerHosts() as DockerHost[];

			const stats: HostStats[] = [];

			for (const host of hosts) {
				const docker = getDockerClient(host);
				const info: DockerInfo = await docker.info();

				const config: HostStats = {
					hostId: host.id as number,
					hostName: host.name,
					dockerVersion: info.ServerVersion,
					apiVersion: info.Driver,
					os: info.OperatingSystem,
					architecture: info.Architecture,
					totalMemory: info.MemTotal,
					totalCPU: info.NCPU,
					labels: info.Labels,
					images: info.Images,
					containers: info.Containers,
					containersPaused: info.ContainersPaused,
					containersRunning: info.ContainersRunning,
					containersStopped: info.ContainersStopped,
				};

				stats.push(config);
			}

			logger.debug("Fetched all hosts");
			return stats;
		} catch (error) {
			throw new Error(error as string);
		}
		//}

		//try {
		//  const hosts = dbFunctions.getDockerHosts() as DockerHost[];
		//
		//  const host = findObjectByKey(hosts, "id", Number(id));
		//  if (!host) {
		//    throw new Error(`Host (${id}) not found`);
		//  }
		//
		//  const docker = getDockerClient(host);
		//  const info: DockerInfo = await docker.info();
		//
		//  const config: HostStats = {
		//    hostId: host.id as number,
		//    hostName: host.name,
		//    dockerVersion: info.ServerVersion,
		//    apiVersion: info.Driver,
		//    os: info.OperatingSystem,
		//    architecture: info.Architecture,
		//    totalMemory: info.MemTotal,
		//    totalCPU: info.NCPU,
		//    labels: info.Labels,
		//    images: info.Images,
		//    containers: info.Containers,
		//    containersPaused: info.ContainersPaused,
		//    containersRunning: info.ContainersRunning,
		//    containersStopped: info.ContainersStopped,
		//  };
		//
		//  logger.debug(`Fetched config for ${host.name}`);
		//  return config;
		//} catch (error) {
		//  throw new Error(`Failed to retrieve host config: ${error}`);
		//}
	}
}

export const BasicDockerHandler = new basicDockerHandler();
