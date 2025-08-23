import DB from '@dockstat/sqlite-wrapper'
import type { DATABASE } from '@dockstat/typings'
import DockerClient from './src/docker-client.js'

// Example usage and basic tests
async function runTests() {
  console.log('🧪 Starting Docker Client Tests...\n')

  // Initialize Docker client with options
  const dockerClient = new DockerClient(
    new DB(':memory:', {
      pragmas: [
        ['journal_mode', 'WAL'],
        ['foreign_keys', 'ON'],
        ['synchronous', 'NORMAL'],
      ],
    }),
    {
      defaultTimeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableMonitoring: true,
      enableEventEmitter: true,
      monitoringOptions: {
        healthCheckInterval: 30000,
        containerEventPollingInterval: 5000,
        hostMetricsInterval: 10000,
        enableContainerEvents: true,
        enableHostMetrics: true,
        enableHealthChecks: true,
      },
    }
  )

  // Test 1: Add test hosts
  console.log('📡 Test 1: Adding Docker hosts...')

  const testHosts: DATABASE.DB_target_host[] = [
    {
      id: 1,
      host: 'localhost',
      port: 2375,
      secure: false,
      name: 'Local Docker',
    },
    // Add more test hosts as needed
    // {
    //   id: 2,
    //   host: 'docker-host-2.local',
    //   secure: true,
    //   name: 'Remote Docker Host',
    // },
  ]

  for (const host of testHosts) {
    try {
      dockerClient.addHost(host)
      console.log(`✅ Added host: ${host.name} (${host.host})`)
    } catch (error) {
      console.error(`❌ Failed to add host ${host.name}:`, error)
    }
  }

  // Test 2: Health checks
  console.log('\n🏥 Test 2: Checking host health...')
  try {
    const healthResults = await dockerClient.checkAllHostsHealth()
    for (const [hostId, healthy] of Object.entries(healthResults)) {
      const host = testHosts.find((h) => h.id === Number.parseInt(hostId))
      console.log(
        `${healthy ? '✅' : '❌'} Host ${host?.name || hostId}: ${healthy ? 'Healthy' : 'Unhealthy'}`
      )
    }
  } catch (error) {
    console.error('❌ Health check failed:', error)
  }

  // Test 3: Get all containers
  console.log('\n📦 Test 3: Fetching all containers...')
  try {
    const containers = await dockerClient.getAllContainers()
    console.log(`✅ Found ${containers.length} containers total`)

    for (const container of containers.slice(0, 5)) {
      console.log(
        `  - ${container.name} (${container.state}) - ${container.image}`
      )
    }

    if (containers.length > 5) {
      console.log(`  ... and ${containers.length - 5} more`)
    }
  } catch (error) {
    console.error('❌ Failed to fetch containers:', error)
  }

  // Test 4: Get host metrics
  console.log('\n📊 Test 4: Fetching host metrics...')
  try {
    const hostMetrics = await dockerClient.getAllHostMetrics()
    for (const metrics of hostMetrics) {
      console.log(`✅ Host: ${metrics.hostName}`)
      console.log(`  - Docker Version: ${metrics.dockerVersion}`)
      console.log(`  - OS: ${metrics.os} (${metrics.architecture})`)
      console.log(
        `  - Memory: ${(metrics.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`
      )
      console.log(`  - CPUs: ${metrics.totalCPU}`)
      console.log(
        `  - Containers: ${metrics.containersRunning}/${metrics.containers} running`
      )
      console.log(`  - Images: ${metrics.images}`)
    }
  } catch (error) {
    console.error('❌ Failed to fetch host metrics:', error)
  }

  // Test 5: Container statistics (for running containers)
  console.log('\n📈 Test 5: Fetching container statistics...')
  try {
    const containerStats = await dockerClient.getAllContainerStats()
    console.log(
      `✅ Got statistics for ${containerStats.length} running containers`
    )

    for (const stats of containerStats.slice(0, 3)) {
      console.log(`  - ${stats.name}:`)
      console.log(`    CPU: ${stats.cpuUsage.toFixed(2)}%`)
      console.log(
        `    Memory: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB / ${(stats.memoryLimit / 1024 / 1024).toFixed(2)} MB`
      )
      console.log(
        `    Network I/O: ↓${(stats.networkRx / 1024).toFixed(2)} KB ↑${(stats.networkTx / 1024).toFixed(2)} KB`
      )
    }
  } catch (error) {
    console.error('❌ Failed to fetch container statistics:', error)
  }

  // Test 5b: All stats (combined container stats and host metrics)
  console.log('\n📊 Test 5b: Fetching all stats (combined)...')
  try {
    const allStats = await dockerClient.getAllStats()
    console.log(
      `✅ Got combined stats: ${allStats.containerStats.length} container stats, ${allStats.hostMetrics.length} host metrics`
    )
    console.log(
      `   Timestamp: ${new Date(allStats.timestamp).toLocaleTimeString()}`
    )

    // Show summary of container stats
    if (allStats.containerStats.length > 0) {
      console.log('   Container Stats Summary:')
      for (const stats of allStats.containerStats.slice(0, 2)) {
        console.log(
          `     - ${stats.name}: CPU ${stats.cpuUsage.toFixed(1)}%, Memory ${(stats.memoryUsage / 1024 / 1024).toFixed(0)}MB`
        )
      }
    }

    // Show summary of host metrics
    if (allStats.hostMetrics.length > 0) {
      console.log('   Host Metrics Summary:')
      for (const metrics of allStats.hostMetrics) {
        console.log(
          `     - ${metrics.hostName}: ${metrics.containersRunning}/${metrics.containers} containers, ${(metrics.totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB RAM`
        )
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch all stats:', error)
  }

  // Test 6: Event system
  console.log('\n🎭 Test 6: Testing event system...')

  // Setup event listeners
  dockerClient.events.on('host:health:changed', (hostId, healthy) => {
    console.log(
      `🔔 Host ${hostId} health changed: ${healthy ? 'Healthy' : 'Unhealthy'}`
    )
  })

  dockerClient.events.on(
    'container:started',
    (hostId, containerId, containerInfo) => {
      console.log(
        `🔔 Container started: ${containerInfo.name} (${containerId}) on host ${hostId}`
      )
    }
  )

  dockerClient.events.on(
    'container:stopped',
    (hostId, containerId, containerInfo) => {
      console.log(
        `🔔 Container stopped: ${containerInfo.name} (${containerId}) on host ${hostId}`
      )
    }
  )

  dockerClient.events.on('error', (error, context) => {
    console.log(`🔔 Error event: ${error.message}`, context)
  })

  dockerClient.events.on('info', (message) => {
    console.log(`🔔 Info: ${message}`)
  })

  console.log('✅ Event listeners configured')

  // Test 7: Start monitoring
  console.log('\n🔍 Test 7: Starting monitoring...')
  try {
    dockerClient.startMonitoring()
    console.log('✅ Monitoring started')
    console.log(`   Monitoring active: ${dockerClient.isMonitoring()}`)
  } catch (error) {
    console.error('❌ Failed to start monitoring:', error)
  }

  // Test 8: Stream management
  console.log('\n🌊 Test 8: Testing stream management...')

  const streamManager = dockerClient.getStreamManager()
  if (streamManager) {
    // Create a test connection
    const connectionId = 'test-connection-1'
    streamManager.createConnection(connectionId)
    console.log('✅ Created stream connection')

    // List available channels
    const channels = streamManager.getAvailableChannels()
    console.log('✅ Available stream channels:')
    for (const channel of channels) {
      console.log(`  - ${channel.name}: ${channel.description}`)
    }

    // Setup message handler
    streamManager.on('message:send', (connId, message) => {
      if (connId === connectionId) {
        console.log(
          `📨 Stream message: ${message.type}`,
          message.data ? '(with data)' : ''
        )
      }
    })

    // Test subscription to container list
    try {
      const subscribeMessage = JSON.stringify({
        id: 'test-sub-1',
        type: 'subscribe',
        channel: 'container_list',
        data: {
          interval: 5000,
          filters: {
            containerStates: ['running'],
          },
        },
      })

      streamManager.handleMessage(connectionId, subscribeMessage)
      console.log('✅ Subscribed to container_list stream')

      // Test subscription to all_stats channel
      const allStatsSubscribeMessage = JSON.stringify({
        id: 'test-sub-2',
        type: 'subscribe',
        channel: 'all_stats',
        data: {
          interval: 10000,
        },
      })

      streamManager.handleMessage(connectionId, allStatsSubscribeMessage)
      console.log('✅ Subscribed to all_stats stream')
    } catch (error) {
      console.error('❌ Failed to subscribe to stream:', error)
    }

    // Clean up after a short delay
    setTimeout(() => {
      streamManager.closeConnection(connectionId)
      console.log('✅ Closed stream connection')
    }, 2000)
  }

  // Test 9: Container operations (if we have containers)
  console.log('\n⚙️ Test 9: Testing container operations...')
  try {
    const containers = await dockerClient.getAllContainers()
    const runningContainer = containers.find((c) => c.state === 'running')

    if (runningContainer) {
      console.log(`Testing with container: ${runningContainer.name}`)

      // Get detailed container info
      const detailedInfo = await dockerClient.getContainer(
        runningContainer.hostId,
        runningContainer.id
      )
      console.log(`✅ Got detailed info for ${detailedInfo.name}`)

      // Get container logs (last 10 lines)
      try {
        const logs = await dockerClient.getContainerLogs(
          runningContainer.hostId,
          runningContainer.id,
          { tail: 10, timestamps: true }
        )
        console.log(
          `✅ Got logs for ${runningContainer.name} (${logs.split('\n').length} lines)`
        )
      } catch (error) {
        console.log(
          `⚠️ Could not get logs for ${runningContainer.name}: ${error.message}`
        )
      }

      // Test exec (safe command)
      try {
        const execResult = await dockerClient.execInContainer(
          runningContainer.hostId,
          runningContainer.id,
          ['echo', 'Hello from Docker client test!']
        )
        console.log(`✅ Exec test successful: ${execResult.stdout.trim()}`)
      } catch (error) {
        console.log(`⚠️ Exec test failed: ${error.message}`)
      }
    } else {
      console.log('⚠️ No running containers found for testing operations')
    }
  } catch (error) {
    console.error('❌ Container operations test failed:', error)
  }

  // Test 10: System information
  console.log('\n🖥️ Test 10: Getting system information...')
  try {
    for (const host of testHosts) {
      const systemInfo = await dockerClient.getSystemInfo(host.id)
      const diskUsage = await dockerClient.getDiskUsage(host.id)

      console.log(`✅ System info for ${host.name}:`)
      console.log(`  - Server Version: ${systemInfo.ServerVersion}`)
      console.log(`  - Storage Driver: ${systemInfo.Driver}`)
      console.log(`  - Logging Driver: ${systemInfo.LoggingDriver}`)
      console.log(
        `  - Total Space: ${((diskUsage.LayersSize || 0) / 1024 / 1024 / 1024).toFixed(2)} GB`
      )
    }
  } catch (error) {
    console.error('❌ Failed to get system information:', error)
  }

  // Wait a bit to see monitoring in action
  console.log('\n⏱️ Waiting 10 seconds to observe monitoring events...')
  await new Promise((resolve) => setTimeout(resolve, 10000))

  // Cleanup
  console.log('\n🧹 Cleaning up...')
  try {
    dockerClient.stopMonitoring()
    await dockerClient.cleanup()
    console.log('✅ Cleanup completed')
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }

  console.log('\n🎉 Docker Client tests completed!')
}

// Utility function to demonstrate Docker client capabilities
async function demonstrateAdvancedFeatures(): Promise<void> {
  console.log('\n🚀 Advanced Features Demo...\n')

  const client = new DockerClient(
    new DB(':memory:', {
      pragmas: [
        ['journal_mode', 'WAL'],
        ['foreign_keys', 'ON'],
        ['synchronous', 'NORMAL'],
      ],
    }),
    {
      enableMonitoring: true,
      monitoringOptions: {
        healthCheckInterval: 60000, // 1 minute
        containerEventPollingInterval: 3000, // 3 seconds
        hostMetricsInterval: 15000, // 15 seconds
      },
    }
  )

  // Add a local Docker host
  client.addHost({
    id: 1,
    host: 'localhost',
    port: 2375,
    secure: false,
    name: 'Local Development',
  })

  // Demonstrate stream callbacks
  console.log('📡 Setting up real-time streams...')

  // Host metrics stream
  const hostStreamKey = client.startHostMetricsStream(
    1,
    (data) => {
      if (data.type === 'host_metrics') {
        const metrics = data.data as {
          containersRunning: number
          containers: number
          totalMemory: number
          totalCPU: number
        }
        console.log('📊 Host Metrics Update:')
        console.log(
          `   Running Containers: ${metrics.containersRunning}/${metrics.containers}`
        )
        console.log(
          `   Memory: ${(metrics.totalMemory / 1024 / 1024 / 1024).toFixed(1)} GB`
        )
        console.log(`   CPUs: ${metrics.totalCPU}`)
      }
    },
    10000
  )

  // Container list stream
  const containerStreamKey = client.startAllContainersStream((data) => {
    if (data.type === 'container_list') {
      const containers = data.data as Array<{ state: string }>
      const running = containers.filter((c) => c.state === 'running').length
      console.log(
        `📦 Container Update: ${running}/${containers.length} running`
      )
    }
  }, 8000)

  // All stats stream (combined container stats and host metrics)
  const allStatsStreamKey = client.startAllStatsStream((data) => {
    if (data.type === 'all_stats') {
      const allStats = data.data as any
      console.log(
        `📈 All Stats Update: ${allStats.containerStats.length} containers, ${allStats.hostMetrics.length} hosts (${new Date(allStats.timestamp).toLocaleTimeString()})`
      )
    }
  }, 12000)

  // Let it run for 30 seconds
  setTimeout(() => {
    console.log('\n🛑 Stopping streams...')
    client.stopStream(hostStreamKey)
    client.stopStream(containerStreamKey)
    client.stopStream(allStatsStreamKey)
    client.cleanup()
  }, 30000)

  console.log('✅ Advanced features demo started (will run for 30 seconds)')
}

// Error handling demo
async function demonstrateErrorHandling(): Promise<void> {
  console.log('\n🚨 Error Handling Demo...\n')

  const client = new DockerClient(
    new DB(':memory:', {
      pragmas: [
        ['journal_mode', 'WAL'],
        ['foreign_keys', 'ON'],
        ['synchronous', 'NORMAL'],
      ],
    }),
    {
      retryAttempts: 2,
      retryDelay: 500,
    }
  )

  // Add an invalid host to test error handling
  client.addHost({
    id: 999,
    host: 'invalid-docker-host.local',
    port: 2375,
    secure: false,
    name: 'Invalid Host',
  })

  // Setup error event listener
  client.events.on('error', (error, context) => {
    console.log(`🔴 Caught error: ${error.message}`)
    if (context) {
      console.log('   Context:', context)
    }
  })

  // Test operations that will fail
  try {
    await client.getContainersForHost(999)
  } catch (error) {
    console.log(
      `✅ Expected error caught: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  try {
    await client.getHostMetrics(999)
  } catch (error) {
    console.log(
      `✅ Expected error caught: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  console.log('✅ Error handling demo completed')
}

// Run tests based on command line arguments
const args = process.argv.slice(2)

if (args.includes('--basic') || args.length === 0) {
  runTests().catch(console.error)
}

if (args.includes('--advanced')) {
  demonstrateAdvancedFeatures().catch(console.error)
}

if (args.includes('--errors')) {
  demonstrateErrorHandling().catch(console.error)
}

if (args.includes('--all')) {
  runTests()
    .then(() => demonstrateAdvancedFeatures())
    .then(() => demonstrateErrorHandling())
    .catch(console.error)
}

// Export for programmatic usage
export { runTests, demonstrateAdvancedFeatures, demonstrateErrorHandling }
