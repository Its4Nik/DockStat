import { DB } from "@dockstat/sqlite-wrapper"
import type { DATABASE } from "@dockstat/typings"
import DockerClient from "../src/docker-client.js"

/**
 * Basic usage example of the Docker client
 * This demonstrates the core functionality without advanced features
 */

async function basicExample() {
	console.log("🐳 Docker Client Basic Usage Example\n")

	// Initialize Docker client
	const dockerClient = new DockerClient(
		new DB(":memory:", {
			pragmas: [
				["journal_mode", "WAL"],
				["foreign_keys", "ON"],
				["synchronous", "NORMAL"],
			],
		}),
		{
			defaultTimeout: 10000,
			retryAttempts: 3,
			retryDelay: 1000,
			enableMonitoring: false, // Keep it simple for this example
		}
	)

	// Add a Docker host
	const host: DATABASE.DB_target_host = {
		id: 1,
		host: "localhost",
		port: 2375,
		secure: false,
		name: "Local Docker",
	}

	dockerClient.addHost(host)
	console.log(`✅ Added Docker host: ${host.name}`)

	try {
		// Check if Docker daemon is accessible
		console.log("\n🔍 Checking Docker daemon health...")
		const isHealthy = await dockerClient.checkHostHealth(host.id)
		console.log(`Docker daemon is ${isHealthy ? "healthy" : "unhealthy"}`)

		if (!isHealthy) {
			console.log(
				"❌ Cannot connect to Docker daemon. Make sure Docker is running."
			)
			return
		}

		// Get system information
		console.log("\n📊 Getting system information...")
		const systemInfo = await dockerClient.getSystemInfo(host.id)
		console.log(`Docker Version: ${systemInfo.KernelVersion}`)
		console.log(`OS: ${systemInfo.OperatingSystem}`)
		console.log(`Architecture: ${systemInfo.Architecture}`)
		console.log(
			`Total Memory: ${(systemInfo.MemTotal / 1024 / 1024 / 1024).toFixed(2)} GB`
		)
		console.log(`CPUs: ${systemInfo.NCPU}`)

		// List all containers
		console.log("\n📦 Listing containers...")
		const containers = await dockerClient.getContainersForHost(host.id)
		console.log(`Found ${containers.length} containers:`)

		for (const container of containers.slice(0, 5)) {
			const ports = container.ports
				.filter((p) => p.publicPort)
				.map((p) => `${p.publicPort}:${p.privatePort}`)
				.join(", ")

			console.log(`  • ${container.name}`)
			console.log(`    Image: ${container.image}`)
			console.log(`    Status: ${container.state}`)
			console.log(`    Ports: ${ports || "none"}`)
			console.log(
				`    Created: ${new Date(container.created * 1000).toLocaleDateString()}`
			)
		}

		if (containers.length > 5) {
			console.log(`  ... and ${containers.length - 5} more containers`)
		}

		// Get statistics for running containers
		const runningContainers = containers.filter((c) => c.state === "running")
		if (runningContainers.length > 0) {
			console.log(
				`\n📈 Getting statistics for ${runningContainers.length} running containers...`
			)

			const containerStats = await dockerClient.getContainerStatsForHost(
				host.id
			)

			for (const stats of containerStats.slice(0, 3)) {
				console.log(`  • ${stats.name}:`)
				console.log(`    CPU Usage: ${stats.cpuUsage.toFixed(2)}%`)
				console.log(
					`    Memory: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB / ${(stats.memoryLimit / 1024 / 1024).toFixed(2)} MB`
				)
				console.log(
					`    Network I/O: ↓ ${(stats.networkRx / 1024).toFixed(2)} KB, ↑ ${(stats.networkTx / 1024).toFixed(2)} KB`
				)
			}
		}

		// Get all stats (combined container stats and host metrics)
		console.log("\n📊 Getting all stats (combined)...")
		try {
			const allStats = await dockerClient.getAllStats()
			console.log(
				`✅ Retrieved combined stats: ${allStats.containerStats.length} container stats, ${allStats.hostMetrics.length} host metrics`
			)
			console.log(
				`    Timestamp: ${new Date(allStats.timestamp).toLocaleTimeString()}`
			)

			console.log("  Container Stats Summary:")
			for (const stats of allStats.containerStats.slice(0, 2)) {
				console.log(
					`    • ${stats.name}: CPU ${stats.cpuUsage.toFixed(1)}%, Memory ${(stats.memoryUsage / 1024 / 1024).toFixed(0)}MB`
				)
			}

			console.log("  Host Metrics Summary:")
			for (const metrics of allStats.hostMetrics) {
				console.log(
					`    • ${metrics.hostName}: ${metrics.containersRunning}/${metrics.containers} containers running`
				)
			}
		} catch (error) {
			console.log(
				`⚠️ Could not get all stats: ${error instanceof Error ? error.message : "Unknown error"}`
			)
		}

		// List images
		console.log("\n🖼️ Listing images...")
		const images = await dockerClient.getImages(host.id)
		console.log(`Found ${images.length} images:`)

		for (const image of images.slice(0, 5)) {
			const tags = image.RepoTags?.join(", ") || "<none>"
			const size = (image.Size / 1024 / 1024).toFixed(2)
			console.log(`  • ${tags} (${size} MB)`)
		}

		// List networks
		console.log("\n🌐 Listing networks...")
		const networks = await dockerClient.getNetworks(host.id)
		console.log(`Found ${networks.length} networks:`)

		for (const network of networks) {
			console.log(`  • ${network.Name} (${network.Driver})`)
		}

		// List volumes
		console.log("\n💾 Listing volumes...")
		const volumes = await dockerClient.getVolumes(host.id)
		console.log(`Found ${volumes.length} volumes:`)

		for (const volume of volumes.slice(0, 5)) {
			console.log(`  • ${volume.Name}`)
		}

		// Example of container control (if there are containers)
		if (runningContainers.length > 0) {
			console.log("\n⚙️ Container control example...")
			const testContainer = runningContainers[0]

			try {
				// Get detailed container information
				const detailedInfo = await dockerClient.getContainer(
					host.id,
					testContainer.id
				)
				console.log(`Selected container for testing: ${detailedInfo.name}`)

				// Get container logs (last 5 lines)
				console.log("Getting container logs...")
				const logs = await dockerClient.getContainerLogs(
					host.id,
					testContainer.id,
					{
						tail: 5,
						timestamps: true,
					}
				)

				const logLines = logs.split("\n").filter((line) => line.trim())
				console.log(`Last ${Math.min(5, logLines.length)} log lines:`)
				for (const line of logLines.slice(-5)) {
					console.log(`    ${line.trim()}`)
				}
			} catch (error) {
				console.log(
					`⚠️ Could not get container details: ${error instanceof Error ? error.message : "Unknown error"}`
				)
			}
		}
	} catch (error) {
		console.error("❌ Error during Docker operations:")
		console.error(error instanceof Error ? error.message : "Unknown error")
	} finally {
		// Cleanup
		console.log("\n🧹 Cleaning up...")
		await dockerClient.cleanup()
		console.log("✅ Cleanup completed")
	}
}

// Real-time monitoring example
async function monitoringExample() {
	console.log("\n🔍 Real-time Monitoring Example\n")

	const dockerClient = new DockerClient(
		new DB(":memory:", {
			pragmas: [
				["journal_mode", "WAL"],
				["foreign_keys", "ON"],
				["synchronous", "NORMAL"],
			],
		}),
		{
			enableMonitoring: true,
			monitoringOptions: {
				healthCheckInterval: 30000,
				containerEventPollingInterval: 5000,
				hostMetricsInterval: 10000,
			},
		}
	)

	// Add host
	dockerClient.addHost({
		id: 1,
		host: "localhost",
		port: 2375,
		secure: false,
		name: "Local Docker",
	})

	// Set up event listeners
	dockerClient.events.on(
		"container:started",
		(hostId, containerId, containerInfo) => {
			console.log(
				`🟢 Container started: ${containerInfo.name} (${containerId}) on host ${hostId}`
			)
		}
	)

	dockerClient.events.on(
		"container:stopped",
		(hostId, containerId, containerInfo) => {
			console.log(
				`🔴 Container stopped: ${containerInfo.name} (${containerId}) on host ${hostId}`
			)
		}
	)

	dockerClient.events.on("host:health:changed", (hostId, healthy) => {
		console.log(
			`💓 Host ${hostId} health changed: ${healthy ? "Healthy" : "Unhealthy"}`
		)
	})

	dockerClient.events.on("error", (error, context) => {
		console.log(`❌ Error: ${error.message}`)
		if (context) {
			console.log(`   Context: ${JSON.stringify(context)}`)
		}
	})

	// Start monitoring
	dockerClient.startMonitoring()
	console.log("✅ Monitoring started. Watching for Docker events...")
	console.log("   Press Ctrl+C to stop monitoring\n")

	// Stop monitoring after 30 seconds (for demo purposes)
	setTimeout(async () => {
		console.log("\n🛑 Stopping monitoring demo...")
		dockerClient.stopMonitoring()
		await dockerClient.cleanup()
		console.log("✅ Monitoring stopped")
	}, 30000)
}

// Streaming example
async function streamingExample() {
	console.log("\n🌊 Streaming Example\n")

	const dockerClient = new DockerClient(
		new DB(":memory:", {
			pragmas: [
				["journal_mode", "WAL"],
				["foreign_keys", "ON"],
				["synchronous", "NORMAL"],
			],
		})
	)

	dockerClient.addHost({
		id: 1,
		host: "localhost",
		port: 2375,
		secure: false,
		name: "Local Docker",
	})

	try {
		// Set up container stats stream
		const containers = await dockerClient.getContainersForHost(1)
		const runningContainer = containers.find((c) => c.state === "running")

		if (runningContainer) {
			console.log(`Setting up stats stream for: ${runningContainer.name}`)

			const streamKey = dockerClient.startContainerStatsStream(
				1,
				runningContainer.id,
				(data) => {
					if (data.type === "container_stats") {
						const stats = data.data as any
						console.log(
							`📊 ${stats.name}: CPU ${stats.cpuUsage.toFixed(1)}%, Memory ${(stats.memoryUsage / 1024 / 1024).toFixed(1)}MB`
						)
					}
				},
				2000 // Update every 2 seconds
			)

			// Also set up all stats stream
			console.log("Setting up combined all stats stream...")
			const allStatsStreamKey = dockerClient.startAllStatsStream(
				(data) => {
					if (data.type === "all_stats") {
						const allStats = data.data as any
						console.log(
							`📈 All Stats: ${allStats.containerStats.length} containers, ${allStats.hostMetrics.length} hosts (${new Date(allStats.timestamp).toLocaleTimeString()})`
						)
					}
				},
				5000 // Update every 5 seconds
			)

			// Stop streams after 15 seconds
			setTimeout(() => {
				console.log("\n🛑 Stopping stats streams...")
				dockerClient.stopStream(streamKey)
				dockerClient.stopStream(allStatsStreamKey)
				dockerClient.cleanup()
			}, 15000)
		} else {
			console.log("⚠️ No running containers found for streaming example")
		}
	} catch (error) {
		console.error("❌ Streaming example error:", error)
	}
}

// Run examples based on command line arguments
const args = process.argv.slice(2)

if (args.includes("--monitoring")) {
	monitoringExample().catch(console.error)
} else if (args.includes("--streaming")) {
	streamingExample().catch(console.error)
} else {
	basicExample().catch(console.error)
}

export { basicExample, monitoringExample, streamingExample }
