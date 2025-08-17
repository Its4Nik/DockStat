import DockerClient from "../src/docker-client.js";
import type { DATABASE } from "@dockstat/typings";

/**
 * Demo script showcasing the new getAllStats functionality
 * This demonstrates both the direct function call and streaming capabilities
 */

async function demonstrateAllStats() {
  console.log("🚀 All Stats Demo - Combined Container Stats & Host Metrics\n");

  // Initialize Docker client
  const dockerClient = new DockerClient({
    defaultTimeout: 10000,
    retryAttempts: 3,
    enableMonitoring: true,
  });

  // Add Docker host
  const host: DATABASE.DB_target_host = {
    id: 1,
    host: "localhost",
    secure: false,
    name: "Local Docker",
  };

  dockerClient.addHost(host);
  console.log(`✅ Added Docker host: ${host.name}`);

  try {
    // Check if Docker daemon is accessible
    console.log("\n🔍 Checking Docker daemon health...");
    const isHealthy = await dockerClient.checkHostHealth(host.id);

    if (!isHealthy) {
      console.log(
        "❌ Cannot connect to Docker daemon. Make sure Docker is running.",
      );
      return;
    }
    console.log("✅ Docker daemon is healthy");

    // Demonstrate the new getAllStats function
    console.log("\n📊 Fetching all stats (combined)...");
    const allStats = await dockerClient.getAllStats();

    console.log("✅ Retrieved combined stats:");
    console.log(
      `   📦 Container Stats: ${allStats.containerStats.length} containers`,
    );
    console.log(`   🖥️ Host Metrics: ${allStats.hostMetrics.length} hosts`);
    console.log(
      `   🕐 Timestamp: ${new Date(allStats.timestamp).toLocaleString()}`,
    );

    // Display detailed container stats
    if (allStats.containerStats.length > 0) {
      console.log("\n📈 Container Statistics:");
      allStats.containerStats.forEach((stats, index) => {
        if (index < 5) {
          // Show first 5 containers
          const memoryMB = (stats.memoryUsage / 1024 / 1024).toFixed(1);
          const memoryLimitMB = (stats.memoryLimit / 1024 / 1024).toFixed(1);
          const networkRxKB = (stats.networkRx / 1024).toFixed(1);
          const networkTxKB = (stats.networkTx / 1024).toFixed(1);

          console.log(`   ${index + 1}. ${stats.name} (${stats.state})`);
          console.log(`      🔸 CPU: ${stats.cpuUsage.toFixed(2)}%`);
          console.log(`      🔸 Memory: ${memoryMB}MB / ${memoryLimitMB}MB`);
          console.log(`      🔸 Network: ↓${networkRxKB}KB ↑${networkTxKB}KB`);
          console.log(`      🔸 Image: ${stats.image}`);
        }
      });

      if (allStats.containerStats.length > 5) {
        console.log(
          `   ... and ${allStats.containerStats.length - 5} more containers`,
        );
      }
    } else {
      console.log("   ℹ️ No running containers found");
    }

    // Display detailed host metrics
    if (allStats.hostMetrics.length > 0) {
      console.log("\n🖥️ Host Metrics:");
      allStats.hostMetrics.forEach((metrics, index) => {
        const totalMemoryGB = (
          metrics.totalMemory /
          1024 /
          1024 /
          1024
        ).toFixed(2);

        console.log(`   ${index + 1}. ${metrics.hostName}`);
        console.log(`      🔸 Docker Version: ${metrics.dockerVersion}`);
        console.log(`      🔸 OS: ${metrics.os} (${metrics.architecture})`);
        console.log(`      🔸 Memory: ${totalMemoryGB} GB`);
        console.log(`      🔸 CPUs: ${metrics.totalCPU}`);
        console.log(
          `      🔸 Containers: ${metrics.containersRunning}/${metrics.containers} running`,
        );
        console.log(`      🔸 Images: ${metrics.images}`);
      });
    }

    // Calculate summary statistics
    const totalContainers = allStats.containerStats.length;
    const runningContainers = allStats.containerStats.filter(
      (c) => c.state === "running",
    ).length;
    const totalHosts = allStats.hostMetrics.length;
    const totalImages = allStats.hostMetrics.reduce(
      (sum, h) => sum + h.images,
      0,
    );
    const totalMemoryGB =
      allStats.hostMetrics.reduce((sum, h) => sum + h.totalMemory, 0) /
      1024 /
      1024 /
      1024;
    const totalCPUs = allStats.hostMetrics.reduce(
      (sum, h) => sum + h.totalCPU,
      0,
    );

    console.log("\n📋 Summary:");
    console.log(`   🔹 Total Hosts: ${totalHosts}`);
    console.log(
      `   🔹 Total Containers: ${runningContainers}/${totalContainers} running`,
    );
    console.log(`   🔹 Total Images: ${totalImages}`);
    console.log(`   🔹 Total Memory: ${totalMemoryGB.toFixed(2)} GB`);
    console.log(`   🔹 Total CPUs: ${totalCPUs}`);

    // Demonstrate streaming functionality
    console.log("\n🌊 Starting all stats stream...");
    let streamCount = 0;

    const streamKey = dockerClient.startAllStatsStream((data) => {
      streamCount++;

      if (data.type === "all_stats") {
        const stats = data.data as {
          containerStats: Array<{ state: string; cpuUsage: number }>;
          hostMetrics: Array<unknown>;
          timestamp: number;
        };
        const timestamp = new Date(stats.timestamp).toLocaleTimeString();

        console.log(`📡 Stream Update #${streamCount} (${timestamp}):`);
        console.log(`   📦 ${stats.containerStats.length} containers`);
        console.log(`   🖥️ ${stats.hostMetrics.length} hosts`);

        // Show CPU usage for running containers
        const runningContainers = stats.containerStats.filter(
          (c: { state: string }) => c.state === "running",
        );
        if (runningContainers.length > 0) {
          const avgCpu =
            runningContainers.reduce(
              (sum: number, c: { cpuUsage: number }) => sum + c.cpuUsage,
              0,
            ) / runningContainers.length;
          console.log(`   📊 Average CPU usage: ${avgCpu.toFixed(2)}%`);
        }
      } else if (data.type === "error") {
        console.log(`❌ Stream error: ${data.data}`);
      }
    }, 3000); // Update every 3 seconds

    console.log("✅ All stats stream started (updates every 3 seconds)");
    console.log("   Stream will run for 15 seconds...\n");

    // Let the stream run for 15 seconds
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Stop the stream
    console.log("\n🛑 Stopping all stats stream...");
    dockerClient.stopStream(streamKey);
    console.log("✅ Stream stopped");

    // Show active streams (should be empty now)
    const activeStreams = dockerClient.getActiveStreams();
    console.log(`📊 Active streams: ${activeStreams.length}`);
  } catch (error) {
    console.error("❌ Error during demo:");
    console.error(error instanceof Error ? error.message : "Unknown error");
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up...");
    await dockerClient.cleanup();
    console.log("✅ Demo completed");
  }
}

// WebSocket stream demo
async function demonstrateWebSocketAllStats() {
  console.log("\n🌐 WebSocket All Stats Demo\n");

  const dockerClient = new DockerClient({
    enableMonitoring: true,
  });

  dockerClient.addHost({
    id: 1,
    host: "localhost",
    secure: false,
    name: "Local Docker",
  });

  const streamManager = dockerClient.getStreamManager();
  if (!streamManager) {
    console.log("❌ Stream manager not available");
    return;
  }

  // Create a simulated WebSocket connection
  const connectionId = "demo-websocket-client";
  streamManager.createConnection(connectionId);
  console.log("✅ Created WebSocket connection");

  // Listen for outgoing messages
  streamManager.on("message:send", (connId, message) => {
    if (connId === connectionId) {
      console.log("📤 WebSocket Message:", {
        type: message.type,
        channel: message.channel,
        dataType: typeof message.data,
        timestamp: new Date(message.timestamp).toLocaleTimeString(),
      });

      if (message.channel === "all_stats" && message.data) {
        const stats = message.data as {
          containerStats?: Array<unknown>;
          hostMetrics?: Array<unknown>;
        };
        console.log(
          `   📊 Stats: ${stats.containerStats?.length || 0} containers, ${stats.hostMetrics?.length || 0} hosts`,
        );
      }
    }
  });

  // Subscribe to all_stats channel
  const subscribeMessage = JSON.stringify({
    id: "sub-all-stats",
    type: "subscribe",
    channel: "all_stats",
    data: {
      interval: 4000,
    },
  });

  console.log("📨 Subscribing to all_stats channel...");
  streamManager.handleMessage(connectionId, subscribeMessage);

  // Let it run for 12 seconds
  console.log("⏱️ Running WebSocket demo for 12 seconds...\n");
  await new Promise((resolve) => setTimeout(resolve, 12000));

  // Cleanup
  console.log("\n🛑 Closing WebSocket connection...");
  streamManager.closeConnection(connectionId);
  await dockerClient.cleanup();
  console.log("✅ WebSocket demo completed");
}

// Performance comparison demo
async function performanceComparison() {
  console.log("\n⚡ Performance Comparison Demo\n");

  const dockerClient = new DockerClient();
  dockerClient.addHost({
    id: 1,
    host: "localhost",
    secure: false,
    name: "Local Docker",
  });

  try {
    // Method 1: Separate calls
    console.log("🔍 Method 1: Separate function calls");
    const start1 = Date.now();

    const containerStats = await dockerClient.getAllContainerStats();
    const hostMetrics = await dockerClient.getAllHostMetrics();

    const duration1 = Date.now() - start1;
    console.log(`   ✅ Completed in ${duration1}ms`);
    console.log(`   📦 Container stats: ${containerStats.length}`);
    console.log(`   🖥️ Host metrics: ${hostMetrics.length}`);

    // Method 2: Combined call
    console.log("\n🚀 Method 2: Combined getAllStats() call");
    const start2 = Date.now();

    const allStats = await dockerClient.getAllStats();

    const duration2 = Date.now() - start2;
    console.log(`   ✅ Completed in ${duration2}ms`);
    console.log(`   📦 Container stats: ${allStats.containerStats.length}`);
    console.log(`   🖥️ Host metrics: ${allStats.hostMetrics.length}`);

    // Performance comparison
    const improvement = ((duration1 - duration2) / duration1) * 100;
    console.log("📊 Performance Analysis:");
    console.log(`   🔸 Separate calls: ${duration1}ms`);
    console.log(`   🔸 Combined call: ${duration2}ms`);
    console.log(
      `   🔸 Improvement: ${improvement > 0 ? "+" : ""}${improvement.toFixed(1)}%`,
    );
  } catch (error) {
    console.error("❌ Performance comparison failed:", error);
  } finally {
    await dockerClient.cleanup();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--websocket")) {
    await demonstrateWebSocketAllStats();
  } else if (args.includes("--performance")) {
    await performanceComparison();
  } else if (args.includes("--all")) {
    await demonstrateAllStats();
    await demonstrateWebSocketAllStats();
    await performanceComparison();
  } else {
    // Default: basic demo
    await demonstrateAllStats();
  }
}

// Run the demo
if (import.meta.main) {
  main().catch(console.error);
}

export {
  demonstrateAllStats,
  demonstrateWebSocketAllStats,
  performanceComparison,
};
