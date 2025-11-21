import type { ContainerStats } from "dockerode"
import type { DOCKER } from "@dockstat/typings"

/**
 * Utility functions for Docker client operations
 */

/**
 * Formats a number of bytes into a human-readable string (e.g., KB, MB, GB).
 * @param bytes - The number of bytes.
 * @param decimals - Number of decimal places to display.
 * @returns Human-readable string representation of bytes.
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 Bytes"

	const k = 1024
	const dm = decimals < 0 ? 0 : decimals
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

/**
 * Formats a CPU usage percentage value to a string with two decimals and a percent sign.
 * @param percentage - The CPU usage percentage.
 * @returns Formatted percentage string.
 */
export function formatCpuPercentage(percentage: number): string {
	return `${percentage.toFixed(2)}%`
}

/**
 * Formats memory usage as a percentage string.
 * @param used - Amount of memory used.
 * @param total - Total memory available.
 * @returns Formatted percentage string.
 */
export function formatMemoryPercentage(used: number, total: number): string {
	const percentage = total > 0 ? (used / total) * 100 : 0
	return `${percentage.toFixed(2)}%`
}

/**
 * Formats uptime in seconds to a human-readable string (e.g., "1d 2h 3m 4s").
 * @param seconds - Uptime in seconds.
 * @returns Human-readable uptime string.
 */
export function formatUptime(seconds: number): string {
	const days = Math.floor(seconds / 86400)
	const hours = Math.floor((seconds % 86400) / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const secs = Math.floor(seconds % 60)

	const parts = []
	if (days > 0) parts.push(`${days}d`)
	if (hours > 0) parts.push(`${hours}h`)
	if (minutes > 0) parts.push(`${minutes}m`)
	if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

	return parts.join(" ")
}

/**
 * Calculates the CPU usage percentage from Docker container stats.
 * @param stats - Docker container stats object.
 * @returns CPU usage percentage.
 */
export function calculateCpuUsage(stats: ContainerStats): number {
	const precpuStats = stats.precpu_stats
	if (!precpuStats?.cpu_usage || !precpuStats.system_cpu_usage) {
		return 0
	}

	const cpuDelta =
		stats.cpu_stats.cpu_usage.total_usage - precpuStats.cpu_usage.total_usage
	const systemDelta =
		stats.cpu_stats.system_cpu_usage - precpuStats.system_cpu_usage

	if (systemDelta > 0 && cpuDelta > 0) {
		return (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100
	}

	return 0
}

/**
 * Calculates memory usage statistics from Docker container stats.
 * @param stats - Docker container stats object.
 * @returns Object containing used, total, and percentage of memory usage.
 */
export function calculateMemoryUsage(stats: ContainerStats): {
	used: number
	total: number
	percentage: number
} {
	const used = stats.memory_stats.usage || 0
	const total = stats.memory_stats.limit || 0
	const percentage = total > 0 ? (used / total) * 100 : 0

	return { used, total, percentage }
}

/**
 * Calculates network I/O (received and transmitted bytes) from Docker container stats.
 * @param stats - Docker container stats object.
 * @returns Object containing rx (received) and tx (transmitted) bytes.
 */
export function calculateNetworkIO(stats: ContainerStats): {
	rx: number
	tx: number
} {
	let rx = 0
	let tx = 0

	if (stats.networks) {
		for (const network of Object.values(stats.networks)) {
			rx += network.rx_bytes || 0
			tx += network.tx_bytes || 0
		}
	}

	return { rx, tx }
}

/**
 * Calculates block I/O (read and write bytes) from Docker container stats.
 * @param stats - Docker container stats object.
 * @returns Object containing read and write bytes.
 */
export function calculateBlockIO(stats: ContainerStats): {
	read: number
	write: number
} {
	const read =
		stats.blkio_stats?.io_service_bytes_recursive?.find(
			(stat) => stat.op === "Read"
		)?.value || 0

	const write =
		stats.blkio_stats?.io_service_bytes_recursive?.find(
			(stat) => stat.op === "Write"
		)?.value || 0

	return { read, write }
}

/**
 * Formats container port mappings into readable strings.
 * @param container - Docker container info object.
 * @returns Array of formatted port mapping strings.
 */
export function formatContainerPorts(
	container: DOCKER.ContainerInfo
): string[] {
	return container.ports
		.filter((port) => port.publicPort)
		.map((port) => `${port.publicPort}:${port.privatePort}/${port.type}`)
}

/**
 * Gets container status information including color and icon for UI display.
 * @param container - Docker container info object.
 * @returns Object with status, color, and icon.
 */
export function getContainerStatusInfo(container: DOCKER.ContainerInfo): {
	status: string
	color: "green" | "red" | "yellow" | "blue" | "gray"
	icon: string
} {
	switch (container.state.toLowerCase()) {
		case "running":
			return { status: "Running", color: "green", icon: "▶️" }
		case "stopped":
		case "exited":
			return { status: "Stopped", color: "red", icon: "⏹️" }
		case "paused":
			return { status: "Paused", color: "yellow", icon: "⏸️" }
		case "restarting":
			return { status: "Restarting", color: "blue", icon: "🔄" }
		case "created":
			return { status: "Created", color: "gray", icon: "📦" }
		default:
			return { status: container.state, color: "gray", icon: "❓" }
	}
}

/**
 * Checks if a container is healthy based on CPU, memory, and state metrics.
 * @param container - Docker container stats info object.
 * @returns Object indicating health, issues, and metrics.
 */
export function isContainerHealthy(container: DOCKER.ContainerStatsInfo): {
	healthy: boolean
	issues: string[]
	metrics: {
		cpuUsage: number
		memoryUsage: number
		memoryPercent: number
		state: string
	}
} {
	const issues: string[] = []

	// Check CPU usage (warn if > 80%)
	if (container.cpuUsage > 80) {
		issues.push(`High CPU usage: ${container.cpuUsage.toFixed(2)}%`)
	}

	// Check memory usage (warn if > 85%)
	const memoryPercent =
		container.memoryLimit > 0
			? (container.memoryUsage / container.memoryLimit) * 100
			: 0

	if (memoryPercent > 85) {
		issues.push(`High memory usage: ${memoryPercent.toFixed(2)}%`)
	}

	// Check if container is running
	if (container.state !== "running") {
		issues.push(`Container not running: ${container.state}`)
	}

	return {
		healthy: issues.length === 0,
		issues,
		metrics: {
			cpuUsage: container.cpuUsage,
			memoryUsage: container.memoryUsage,
			memoryPercent: memoryPercent,
			state: container.state,
		},
	}
}

/**
 * Checks if a host is healthy based on container metrics.
 * @param metrics - Docker host metrics object.
 * @returns Object indicating health, issues, and metrics.
 */
export function isHostHealthy(metrics: DOCKER.HostMetrics): {
	healthy: boolean
	issues: string[]
	metrics: {
		containerRatio: number
		runningContainers: number
		stoppedContainers: number
		totalContainers: number
	}
} {
	const issues: string[] = []

	// Check if we have any running containers vs total containers
	const containerRatio =
		metrics.containers > 0 ? metrics.containersRunning / metrics.containers : 1

	if (containerRatio < 0.5 && metrics.containers > 0) {
		issues.push(
			`Low container running ratio: ${(containerRatio * 100).toFixed(1)}%`
		)
	}

	// Check for stopped containers
	if (metrics.containersStopped > metrics.containersRunning) {
		issues.push(
			`More stopped containers than running: ${metrics.containersStopped} stopped vs ${metrics.containersRunning} running`
		)
	}

	return {
		healthy: issues.length === 0,
		issues,
		metrics: {
			containerRatio,
			runningContainers: metrics.containersRunning,
			stoppedContainers: metrics.containersStopped,
			totalContainers: metrics.containers,
		},
	}
}

/**
 * Generates a summary of container statistics
 */
export interface ContainerSummary {
	total: number
	running: number
	stopped: number
	paused: number
	byImage: Record<string, number>
	byHost: Record<number, number>
}

/**
 * Generates a summary of container statistics, including counts by state, image, and host.
 * @param containers - Array of Docker container info objects.
 * @returns ContainerSummary object.
 */
export function generateContainerSummary(
	containers: DOCKER.ContainerInfo[]
): ContainerSummary {
	const summary = {
		total: containers.length,
		running: 0,
		stopped: 0,
		paused: 0,
		byImage: {} as Record<string, number>,
		byHost: {} as Record<number, number>,
	}

	for (const container of containers) {
		// Count by state
		switch (container.state.toLowerCase()) {
			case "running":
				summary.running++
				break
			case "stopped":
			case "exited":
				summary.stopped++
				break
			case "paused":
				summary.paused++
				break
		}

		// Count by image
		const imageName = container.image.split(":")[0] // Remove tag
		summary.byImage[imageName] = (summary.byImage[imageName] || 0) + 1

		// Count by host
		summary.byHost[container.hostId] =
			(summary.byHost[container.hostId] || 0) + 1
	}

	return summary
}

/**
 * Generates a summary of host metrics
 */
export interface HostSummary {
	totalHosts: number
	totalContainers: number
	totalRunningContainers: number
	totalImages: number
	totalMemory: number
	totalCPU: number
	averageLoad: number
}

/**
 * Generates a summary of host metrics, including totals and averages.
 * @param hosts - Array of Docker host metrics objects.
 * @returns HostSummary object.
 */
export function generateHostSummary(hosts: DOCKER.HostMetrics[]): HostSummary {
	const summary = {
		totalHosts: hosts.length,
		totalContainers: 0,
		totalRunningContainers: 0,
		totalImages: 0,
		totalMemory: 0,
		totalCPU: 0,
		averageLoad: 0,
	}

	for (const host of hosts) {
		summary.totalContainers += host.containers
		summary.totalRunningContainers += host.containersRunning
		summary.totalImages += host.images
		summary.totalMemory += host.totalMemory
		summary.totalCPU += host.totalCPU
	}

	// Calculate average load (running containers / total containers)
	summary.averageLoad =
		summary.totalContainers > 0
			? summary.totalRunningContainers / summary.totalContainers
			: 0

	return summary
}

/**
 * Validates the format of a Docker container name.
 * @param name - The container name to validate.
 * @returns True if valid, false otherwise.
 */
export function isValidContainerName(name: string): boolean {
	// Docker container names must match: [a-zA-Z0-9][a-zA-Z0-9_.-]*
	const regex = /^[a-zA-Z0-9][\w.-]*$/
	return regex.test(name) && name.length <= 63
}

/**
 * Validates the format of a Docker image name.
 * @param name - The image name to validate.
 * @returns True if valid, false otherwise.
 */
export function isValidImageName(name: string): boolean {
	// Basic validation for Docker image names
	const regex =
		/^[a-z\d]+(?:[._-][a-z\d]+)*(?:\/[a-z\d]+(?:[._-][a-z\d]+)*)*(?::[a-zA-Z\d_.-]+)?$/
	return regex.test(name)
}

/**
 * Parses a Docker image name into its registry, namespace, repository, and tag components.
 * @param imageName - The Docker image name to parse.
 * @returns ImageNameInfo object with parsed components.
 */
export interface ImageNameInfo {
	registry?: string
	namespace?: string
	repository: string
	tag: string
}

export function parseImageName(imageName: string): ImageNameInfo {
	let registry: string | undefined
	let namespace: string | undefined
	let repository: string
	const [namepart, tagPart] = imageName.split(":")
	const tag: string = tagPart || "latest"

	// Check for registry (contains . or :)
	const parts = namepart.split("/")

	if (parts.length === 1) {
		// Simple image name like "nginx"
		repository = parts[0]
	} else if (parts.length === 2) {
		// Could be "nginx/nginx" or "localhost:5000/nginx"
		if (parts[0].includes(".") || parts[0].includes(":")) {
			registry = parts[0]
			repository = parts[1]
		} else {
			namespace = parts[0]
			repository = parts[1]
		}
	} else if (parts.length === 3) {
		// "registry.com/namespace/repo"
		registry = parts[0]
		namespace = parts[1]
		repository = parts[2]
	} else {
		// Complex case, assume first part is registry
		registry = parts[0]
		namespace = parts.slice(1, -1).join("/")
		repository = parts[parts.length - 1]
	}

	return { registry, namespace, repository, tag }
}

/**
 * Sanitizes a container or image name for safe usage (lowercase, valid chars, max length).
 * @param name - The name to sanitize.
 * @returns Sanitized name string.
 */
export function sanitizeName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z\d._-]/g, "-")
		.replace(/^[-_.]+|[-_.]+$/g, "")
		.substring(0, 63)
}

/**
 * Creates a promise that resolves after a specified delay (in milliseconds).
 * @param ms - Milliseconds to delay.
 * @returns Promise that resolves after the delay.
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Debounces a function call, ensuring it's only called after a specified wait time has elapsed since the last invocation.
 * @param func - The function to debounce.
 * @param wait - Milliseconds to wait before calling the function.
 * @returns Debounced function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout

	return (...args: Parameters<T>) => {
		clearTimeout(timeout)
		timeout = setTimeout(() => func(...args), wait)
	}
}

/**
 * Throttles a function call, ensuring it's only called at most once in a specified time interval.
 * @param func - The function to throttle.
 * @param limit - Milliseconds interval to throttle calls.
 * @returns Throttled function.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean

	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args)
			inThrottle = true
			setTimeout(() => {
				inThrottle = false
			}, limit)
		}
	}
}
