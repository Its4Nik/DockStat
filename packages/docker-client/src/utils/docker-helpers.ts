import type { ContainerStats } from "dockerode";
import type { DOCKER } from "@dockstat/typings";

/**
 * Utility functions for Docker client operations
 */

/**
 * Formats bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Formats CPU percentage
 */
export function formatCpuPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * Formats memory usage percentage
 */
export function formatMemoryPercentage(used: number, total: number): string {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  return `${percentage.toFixed(2)}%`;
}

/**
 * Formats uptime from seconds to human readable format
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

/**
 * Calculates CPU usage percentage from container stats
 */
export function calculateCpuUsage(stats: ContainerStats): number {
  const precpuStats = stats.precpu_stats;
  if (!precpuStats?.cpu_usage || !precpuStats.system_cpu_usage) {
    return 0;
  }

  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage - precpuStats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - precpuStats.system_cpu_usage;

  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
  }

  return 0;
}

/**
 * Calculates memory usage percentage from container stats
 */
export function calculateMemoryUsage(stats: ContainerStats): {
  used: number;
  total: number;
  percentage: number;
} {
  const used = stats.memory_stats.usage || 0;
  const total = stats.memory_stats.limit || 0;
  const percentage = total > 0 ? (used / total) * 100 : 0;

  return { used, total, percentage };
}

/**
 * Calculates network I/O from container stats
 */
export function calculateNetworkIO(stats: ContainerStats): {
  rx: number;
  tx: number;
} {
  let rx = 0;
  let tx = 0;

  if (stats.networks) {
    for (const network of Object.values(stats.networks)) {
      rx += network.rx_bytes || 0;
      tx += network.tx_bytes || 0;
    }
  }

  return { rx, tx };
}

/**
 * Calculates block I/O from container stats
 */
export function calculateBlockIO(stats: ContainerStats): {
  read: number;
  write: number;
} {
  const read =
    stats.blkio_stats?.io_service_bytes_recursive?.find(
      (stat) => stat.op === "Read",
    )?.value || 0;

  const write =
    stats.blkio_stats?.io_service_bytes_recursive?.find(
      (stat) => stat.op === "Write",
    )?.value || 0;

  return { read, write };
}

/**
 * Extracts container port mappings in a readable format
 */
export function formatContainerPorts(
  container: DOCKER.ContainerInfo,
): string[] {
  return container.ports
    .filter((port) => port.publicPort)
    .map((port) => `${port.publicPort}:${port.privatePort}/${port.type}`);
}

/**
 * Gets container status with color coding info
 */
export function getContainerStatusInfo(container: DOCKER.ContainerInfo): {
  status: string;
  color: "green" | "red" | "yellow" | "blue" | "gray";
  icon: string;
} {
  switch (container.state.toLowerCase()) {
    case "running":
      return { status: "Running", color: "green", icon: "▶️" };
    case "stopped":
    case "exited":
      return { status: "Stopped", color: "red", icon: "⏹️" };
    case "paused":
      return { status: "Paused", color: "yellow", icon: "⏸️" };
    case "restarting":
      return { status: "Restarting", color: "blue", icon: "🔄" };
    case "created":
      return { status: "Created", color: "gray", icon: "📦" };
    default:
      return { status: container.state, color: "gray", icon: "❓" };
  }
}

/**
 * Checks if a container is healthy based on various metrics
 */
export function isContainerHealthy(container: DOCKER.ContainerStatsInfo): {
  healthy: boolean;
  issues: string[];
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    memoryPercent: number;
    state: string;
  };
} {
  const issues: string[] = [];

  // Check CPU usage (warn if > 80%)
  if (container.cpuUsage > 80) {
    issues.push(`High CPU usage: ${container.cpuUsage.toFixed(2)}%`);
  }

  // Check memory usage (warn if > 85%)
  const memoryPercent =
    container.memoryLimit > 0
      ? (container.memoryUsage / container.memoryLimit) * 100
      : 0;

  if (memoryPercent > 85) {
    issues.push(`High memory usage: ${memoryPercent.toFixed(2)}%`);
  }

  // Check if container is running
  if (container.state !== "running") {
    issues.push(`Container not running: ${container.state}`);
  }

  return {
    healthy: issues.length === 0,
    issues,
    metrics: {
      cpuUsage: container.cpuUsage,
      memoryUsage: container.memoryUsage,
      memoryPercent: memoryPercent,
      state: container.state
    }
  };
}

/**
 * Checks if a host is healthy based on metrics
 */
export function isHostHealthy(metrics: DOCKER.HostMetrics): {
  healthy: boolean;
  issues: string[];
  metrics: {
    containerRatio: number;
    runningContainers: number;
    stoppedContainers: number;
    totalContainers: number;
  };
} {
  const issues: string[] = [];

  // Check if we have any running containers vs total containers
  const containerRatio =
    metrics.containers > 0 ? metrics.containersRunning / metrics.containers : 1;

  if (containerRatio < 0.5 && metrics.containers > 0) {
    issues.push(
      `Low container running ratio: ${(containerRatio * 100).toFixed(1)}%`,
    );
  }

  // Check for stopped containers
  if (metrics.containersStopped > metrics.containersRunning) {
    issues.push(
      `More stopped containers than running: ${metrics.containersStopped} stopped vs ${metrics.containersRunning} running`,
    );
  }

  return {
    healthy: issues.length === 0,
    issues,
    metrics: {
      containerRatio,
      runningContainers: metrics.containersRunning,
      stoppedContainers: metrics.containersStopped,
      totalContainers: metrics.containers
    }
  };
}

/**
 * Generates a summary of container statistics
 */
export interface ContainerSummary {
  total: number;
  running: number;
  stopped: number;
  paused: number;
  byImage: Record<string, number>;
  byHost: Record<number, number>;
}

export function generateContainerSummary(containers: DOCKER.ContainerInfo[]): ContainerSummary {
  const summary = {
    total: containers.length,
    running: 0,
    stopped: 0,
    paused: 0,
    byImage: {} as Record<string, number>,
    byHost: {} as Record<number, number>,
  };

  for (const container of containers) {
    // Count by state
    switch (container.state.toLowerCase()) {
      case "running":
        summary.running++;
        break;
      case "stopped":
      case "exited":
        summary.stopped++;
        break;
      case "paused":
        summary.paused++;
        break;
    }

    // Count by image
    const imageName = container.image.split(":")[0]; // Remove tag
    summary.byImage[imageName] = (summary.byImage[imageName] || 0) + 1;

    // Count by host
    summary.byHost[container.hostId] =
      (summary.byHost[container.hostId] || 0) + 1;
  }

  return summary;
}

/**
 * Generates a summary of host metrics
 */
export interface HostSummary {
  totalHosts: number;
  totalContainers: number;
  totalRunningContainers: number;
  totalImages: number;
  totalMemory: number;
  totalCPU: number;
  averageLoad: number;
}

export function generateHostSummary(hosts: DOCKER.HostMetrics[]): HostSummary {
  const summary = {
    totalHosts: hosts.length,
    totalContainers: 0,
    totalRunningContainers: 0,
    totalImages: 0,
    totalMemory: 0,
    totalCPU: 0,
    averageLoad: 0,
  };

  for (const host of hosts) {
    summary.totalContainers += host.containers;
    summary.totalRunningContainers += host.containersRunning;
    summary.totalImages += host.images;
    summary.totalMemory += host.totalMemory;
    summary.totalCPU += host.totalCPU;
  }

  // Calculate average load (running containers / total containers)
  summary.averageLoad =
    summary.totalContainers > 0
      ? summary.totalRunningContainers / summary.totalContainers
      : 0;

  return summary;
}

/**
 * Validates container name format
 */
export function isValidContainerName(name: string): boolean {
  // Docker container names must match: [a-zA-Z0-9][a-zA-Z0-9_.-]*
  const regex = /^[a-zA-Z0-9][\w.-]*$/;
  return regex.test(name) && name.length <= 63;
}

/**
 * Validates Docker image name format
 */
export function isValidImageName(name: string): boolean {
  // Basic validation for Docker image names
  const regex =
    /^[a-z\d]+(?:[._-][a-z\d]+)*(?:\/[a-z\d]+(?:[._-][a-z\d]+)*)*(?::[a-zA-Z\d_.-]+)?$/;
  return regex.test(name);
}

/**
 * Parses Docker image name into components
 */
export interface ImageNameInfo {
  registry?: string;
  namespace?: string;
  repository: string;
  tag: string;
}

export function parseImageName(imageName: string): ImageNameInfo {
  let registry: string | undefined;
  let namespace: string | undefined;
  let repository: string;
  const [namepart, tagPart] = imageName.split(":");
  const tag: string = tagPart || "latest";

  // Check for registry (contains . or :)
  const parts = namepart.split("/");

  if (parts.length === 1) {
    // Simple image name like "nginx"
    repository = parts[0];
  } else if (parts.length === 2) {
    // Could be "nginx/nginx" or "localhost:5000/nginx"
    if (parts[0].includes(".") || parts[0].includes(":")) {
      registry = parts[0];
      repository = parts[1];
    } else {
      namespace = parts[0];
      repository = parts[1];
    }
  } else if (parts.length === 3) {
    // "registry.com/namespace/repo"
    registry = parts[0];
    namespace = parts[1];
    repository = parts[2];
  } else {
    // Complex case, assume first part is registry
    registry = parts[0];
    namespace = parts.slice(1, -1).join("/");
    repository = parts[parts.length - 1];
  }

  return { registry, namespace, repository, tag };
}

/**
 * Sanitizes container or image names for safe usage
 */
export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\d._-]/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "")
    .substring(0, 63);
}

/**
 * Creates a delay promise for retry mechanisms
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttles a function call
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
