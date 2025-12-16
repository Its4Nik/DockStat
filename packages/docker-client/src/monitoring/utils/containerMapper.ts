import type { DOCKER } from "@dockstat/typings"
import type Dockerode from "dockerode"
import { logger } from "."

export function mapContainerInfo(
  container: Dockerode.ContainerInfo,
  hostId: number
): DOCKER.ContainerInfo {
  logger.debug("Mapping container info")
  return {
    id: container.Id,
    hostId,
    name: container.Names[0]?.replace("/", "") || "unknown",
    image: container.Image,
    status: container.Status,
    state: container.State,
    created: container.Created,
    ports: container.Ports.map((port) => ({
      privatePort: port.PrivatePort,
      publicPort: port.PublicPort,
      type: port.Type,
    })),
    labels: container.Labels || {},
    networkSettings: container.NetworkSettings
      ? { networks: container.NetworkSettings.Networks || {} }
      : undefined,
  }
}

export function mapContainerInfoFromInspect(
  containerInfo: Dockerode.ContainerInspectInfo,
  hostId: number
): DOCKER.ContainerInfo {
  logger.debug("Mapping container info from inspect")
  return {
    id: containerInfo.Id,
    hostId,
    name: containerInfo.Name.replace("/", ""),
    image: containerInfo.Config.Image,
    status: containerInfo.State.Status,
    state: containerInfo.State.Status,
    created: Math.floor(new Date(containerInfo.Created).getTime() / 1000),
    ports: Object.entries(containerInfo.NetworkSettings.Ports || {}).map(([port, bindings]) => ({
      privatePort: Number.parseInt(port.split("/")[0], 10),
      publicPort: bindings?.[0]?.HostPort ? Number.parseInt(bindings[0].HostPort, 10) : undefined,
      type: port.split("/")[1] || "tcp",
    })),
    labels: containerInfo.Config.Labels || {},
    networkSettings: {
      networks: containerInfo.NetworkSettings.Networks || {},
    },
  }
}
