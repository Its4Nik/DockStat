import { EventEmitter } from "node:events";
import type { DOCKER } from "@dockstat/typings";

export class DockerEventEmitter
  extends EventEmitter
  implements DOCKER.DockerEventEmitterInterface
{
  constructor() {
    super();
    this.setMaxListeners(50); // Allow more listeners for monitoring scenarios
  }

  public emitHostAdded(hostId: number, hostName: string): void {
    this.emit("host:added", hostId, hostName);
    this.emit("info", `Host added: ${hostName} (ID: ${hostId})`, {
      hostId,
      hostName,
    });
  }

  public emitHostRemoved(hostId: number, hostName: string): void {
    this.emit("host:removed", hostId, hostName);
    this.emit("info", `Host removed: ${hostName} (ID: ${hostId})`, {
      hostId,
      hostName,
    });
  }

  public emitHostUpdated(hostId: number, hostName: string): void {
    this.emit("host:updated", hostId, hostName);
    this.emit("info", `Host updated: ${hostName} (ID: ${hostId})`, {
      hostId,
      hostName,
    });
  }

  public emitHostHealthChanged(hostId: number, healthy: boolean): void {
    this.emit("host:health:changed", hostId, healthy);
    if (healthy) {
      this.emit("info", `Host ${hostId} is now healthy`);
    } else {
      this.emit("warning", `Host ${hostId} is unhealthy`);
    }
  }

  public emitHostMetrics(hostId: number, metrics: DOCKER.HostMetrics): void {
    this.emit("host:metrics", hostId, metrics);
  }

  public emitContainerStats(
    hostId: number,
    containerId: string,
    stats: DOCKER.ContainerStatsInfo,
  ): void {
    this.emit("container:stats", hostId, containerId, stats);
  }

  public emitContainerStarted(
    hostId: number,
    containerId: string,
    containerInfo: DOCKER.ContainerInfo,
  ): void {
    this.emit("container:started", hostId, containerId, containerInfo);
    this.emit(
      "info",
      `Container started: ${containerInfo.name} (${containerId.substring(0, 12)})`,
      {
        hostId,
        containerId,
        containerName: containerInfo.name,
      },
    );
  }

  public emitContainerStopped(
    hostId: number,
    containerId: string,
    containerInfo: DOCKER.ContainerInfo,
  ): void {
    this.emit("container:stopped", hostId, containerId, containerInfo);
    this.emit(
      "info",
      `Container stopped: ${containerInfo.name} (${containerId.substring(0, 12)})`,
      {
        hostId,
        containerId,
        containerName: containerInfo.name,
      },
    );
  }

  public emitContainerRemoved(hostId: number, containerId: string): void {
    this.emit("container:removed", hostId, containerId);
    this.emit("info", `Container removed: ${containerId.substring(0, 12)}`, {
      hostId,
      containerId,
    });
  }

  public emitContainerCreated(
    hostId: number,
    containerId: string,
    containerInfo: DOCKER.ContainerInfo,
  ): void {
    this.emit("container:created", hostId, containerId, containerInfo);
    this.emit(
      "info",
      `Container created: ${containerInfo.name} (${containerId.substring(0, 12)})`,
      {
        hostId,
        containerId,
        containerName: containerInfo.name,
      },
    );
  }

  public emitContainerDied(hostId: number, containerId: string): void {
    this.emit("container:died", hostId, containerId);
    this.emit("warning", `Container died: ${containerId.substring(0, 12)}`, {
      hostId,
      containerId,
    });
  }

  public emitStreamStarted(streamKey: string, streamType: string): void {
    this.emit("stream:started", streamKey, streamType);
    this.emit("info", `Stream started: ${streamType} (${streamKey})`, {
      streamKey,
      streamType,
    });
  }

  public emitStreamStopped(streamKey: string, streamType: string): void {
    this.emit("stream:stopped", streamKey, streamType);
    this.emit("info", `Stream stopped: ${streamType} (${streamKey})`, {
      streamKey,
      streamType,
    });
  }

  public emitStreamData(
    streamKey: string,
    data: DOCKER.DockerStreamData,
  ): void {
    this.emit("stream:data", streamKey, data);
  }

  public emitStreamError(streamKey: string, error: Error): void {
    this.emit("stream:error", streamKey, error);
    this.emit("error", error, { streamKey });
  }

  public emitError(error: Error, context?: any): void {
    this.emit("error", error, context);
  }

  public emitWarning(message: string, context?: any): void {
    this.emit("warning", message, context);
  }

  public emitInfo(message: string, context?: any): void {
    this.emit("info", message, context);
  }
}
