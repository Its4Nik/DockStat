# @dockstat/docker-client

A comprehensive Docker client library built on top of Dockerode with full TypeScript support, real-time monitoring, event streaming, and advanced container management capabilities.

## Features

- 🚀 **Full TypeScript Support** - Complete type safety with @dockstat/typings integration
- 🔍 **Real-time Monitoring** - Automatic health checks, container events, and metrics collection
- 🌊 **Bidirectional Streaming** - WebSocket-compatible streaming for web UI integration
- 📊 **Comprehensive Metrics** - Container statistics, host metrics, and system information
- ⚡ **High Performance** - Built-in retry mechanisms, connection pooling, and efficient polling
- 🎯 **Event-Driven Architecture** - Rich event system for reactive applications
- 🛡️ **Robust Error Handling** - Graceful failover and detailed error reporting
- 🔧 **Extensible Design** - Modular architecture for easy customization and extension

## Installation

```bash
bun add @dockstat/docker-client
```

## Quick Start

```typescript
import DockerClient from '@dockstat/docker-client';

// Initialize the client
const dockerClient = new DockerClient({
  defaultTimeout: 5000,
  retryAttempts: 3,
  enableMonitoring: true,
});

// Add Docker hosts
dockerClient.addHost({
  id: 1,
  host: 'localhost',
  secure: false,
  name: 'Local Docker',
});

// Get all containers
const containers = await dockerClient.getAllContainers();
console.log(`Found ${containers.length} containers`);

// Start monitoring
dockerClient.startMonitoring();

// Listen to events
dockerClient.events.on('container:started', (hostId, containerId, containerInfo) => {
  console.log(`Container ${containerInfo.name} started on host ${hostId}`);
});
```

## Core Concepts

### Host Management

The Docker client manages multiple Docker hosts, allowing you to monitor and control containers across different machines.

```typescript
import type { DATABASE } from '@dockstat/typings';

// Add a Docker host
const host: DATABASE.DB_target_host = {
  id: 1,
  host: 'docker.example.com',
  secure: true,  // Use HTTPS
  name: 'Production Docker Host',
};

dockerClient.addHost(host);

// Update host configuration
const updatedHost = { ...host, name: 'Updated Production Host' };
dockerClient.updateHost(host, updatedHost);

// Remove a host
dockerClient.removeHost(host);

// Get all configured hosts
const allHosts = dockerClient.getHosts();
```

### Container Operations

#### Basic Container Management

```typescript
// Get all containers across all hosts
const containers = await dockerClient.getAllContainers();

// Get containers for a specific host
const hostContainers = await dockerClient.getContainersForHost(1);

// Get detailed container information
const containerInfo = await dockerClient.getContainer(1, 'container_id');

// Container lifecycle operations
await dockerClient.startContainer(1, 'container_id');
await dockerClient.stopContainer(1, 'container_id');
await dockerClient.restartContainer(1, 'container_id');
await dockerClient.pauseContainer(1, 'container_id');
await dockerClient.unpauseContainer(1, 'container_id');
await dockerClient.removeContainer(1, 'container_id', false); // force = false
```

#### Advanced Container Operations

```typescript
// Execute commands in containers
const result = await dockerClient.execInContainer(1, 'container_id', ['ls', '-la'], {
  workingDir: '/app',
  env: ['NODE_ENV=production'],
});
console.log(result.stdout, result.stderr, result.exitCode);

// Get container logs
const logs = await dockerClient.getContainerLogs(1, 'container_id', {
  tail: 100,
  timestamps: true,
  since: '2024-01-01T00:00:00Z',
});

// Rename container
await dockerClient.renameContainer(1, 'container_id', 'new_name');

// Kill container with specific signal
await dockerClient.killContainer(1, 'container_id', 'SIGTERM');
```

### Container Statistics

```typescript
// Get statistics for all running containers
const allStats = await dockerClient.getAllContainerStats();

// Get all stats (combined container stats and host metrics)
const combinedStats = await dockerClient.getAllStats();
console.log('Container Stats:', combinedStats.containerStats.length);
console.log('Host Metrics:', combinedStats.hostMetrics.length);
console.log('Timestamp:', new Date(combinedStats.timestamp));

// Get statistics for containers on a specific host
const hostStats = await dockerClient.getContainerStatsForHost(1);

// Get statistics for a specific container
const containerStats = await dockerClient.getContainerStats(1, 'container_id');

// Example of using container statistics
allStats.forEach(stats => {
  console.log(`${stats.name}:`);
  console.log(`  CPU: ${stats.cpuUsage.toFixed(2)}%`);
  console.log(`  Memory: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Network I/O: ↓${stats.networkRx} ↑${stats.networkTx} bytes`);
  console.log(`  Block I/O: ↓${stats.blockRead} ↑${stats.blockWrite} bytes`);
});
```

### Host Metrics

```typescript
// Get metrics for all hosts
const allMetrics = await dockerClient.getAllHostMetrics();

// Get metrics for a specific host
const hostMetrics = await dockerClient.getHostMetrics(1);

console.log(`Host: ${hostMetrics.hostName}`);
console.log(`Docker Version: ${hostMetrics.dockerVersion}`);
console.log(`OS: ${hostMetrics.os} (${hostMetrics.architecture})`);
console.log(`Memory: ${(hostMetrics.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log(`CPUs: ${hostMetrics.totalCPU}`);
console.log(`Containers: ${hostMetrics.containersRunning}/${hostMetrics.containers}`);
```

## Real-time Monitoring

### Automatic Monitoring

```typescript
const dockerClient = new DockerClient({
  enableMonitoring: true,
  monitoringOptions: {
    healthCheckInterval: 30000,        // Health checks every 30 seconds
    containerEventPollingInterval: 5000,  // Container events every 5 seconds
    hostMetricsInterval: 10000,        // Host metrics every 10 seconds
    enableContainerEvents: true,       // Monitor container lifecycle events
    enableHostMetrics: true,           // Monitor host metrics
    enableHealthChecks: true,          // Monitor host health
  },
});

// Start monitoring
dockerClient.startMonitoring();

// Check if monitoring is active
const isMonitoring = dockerClient.isMonitoring();

// Stop monitoring
dockerClient.stopMonitoring();
```

### Event System

```typescript
// Container lifecycle events
dockerClient.events.on('container:started', (hostId, containerId, containerInfo) => {
  console.log(`Container ${containerInfo.name} started`);
});

dockerClient.events.on('container:stopped', (hostId, containerId, containerInfo) => {
  console.log(`Container ${containerInfo.name} stopped`);
});

dockerClient.events.on('container:created', (hostId, containerId, containerInfo) => {
  console.log(`New container ${containerInfo.name} created`);
});

dockerClient.events.on('container:removed', (hostId, containerId) => {
  console.log(`Container ${containerId} removed`);
});

// Host events
dockerClient.events.on('host:added', (hostId, hostName) => {
  console.log(`Host ${hostName} added`);
});

dockerClient.events.on('host:health:changed', (hostId, healthy) => {
  console.log(`Host ${hostId} health: ${healthy ? 'Healthy' : 'Unhealthy'}`);
});

dockerClient.events.on('host:metrics', (hostId, metrics) => {
  console.log(`Host ${hostId} metrics updated:`, metrics);
});

// System events
dockerClient.events.on('error', (error, context) => {
  console.error('Docker client error:', error.message, context);
});

dockerClient.events.on('warning', (message, context) => {
  console.warn('Docker client warning:', message, context);
});

dockerClient.events.on('info', (message, context) => {
  console.info('Docker client info:', message, context);
});
```

## Streaming for Web UI Integration

The Docker client includes a powerful streaming system designed for real-time web UI integration.

### Basic Streaming

```typescript
// Start a container statistics stream
const streamKey = dockerClient.startContainerStatsStream(
  1,              // hostId
  'container_id', // containerId
  (data) => {     // callback
    if (data.type === 'container_stats') {
      console.log('Container stats:', data.data);
    } else if (data.type === 'error') {
      console.error('Stream error:', data.data);
    }
  },
  1000            // interval in milliseconds
);

// Start a host metrics stream
const hostStreamKey = dockerClient.startHostMetricsStream(1, (data) => {
  console.log('Host metrics:', data.data);
}, 5000);

// Start a container list stream
const listStreamKey = dockerClient.startAllContainersStream((data) => {
  console.log('Container list update:', data.data);
}, 2000);

// Start an all stats stream (combined container stats and host metrics)
const allStatsStreamKey = dockerClient.startAllStatsStream((data) => {
  if (data.type === 'all_stats') {
    const allStats = data.data;
    console.log('All stats update:', {
      containers: allStats.containerStats.length,
      hosts: allStats.hostMetrics.length,
      timestamp: new Date(allStats.timestamp)
    });
  }
}, 5000);

// Stop streams
dockerClient.stopStream(streamKey);
dockerClient.stopStream(hostStreamKey);
dockerClient.stopStream(listStreamKey);
dockerClient.stopStream(allStatsStreamKey);

// Stop all streams
dockerClient.stopAllStreams();

// Get active stream keys
const activeStreams = dockerClient.getActiveStreams();
```

### Advanced Streaming with WebSocket-like Interface

```typescript
const streamManager = dockerClient.getStreamManager();

if (streamManager) {
  // Create a connection (simulate WebSocket connection)
  const connectionId = 'websocket-client-123';
  streamManager.createConnection(connectionId);

  // Handle incoming messages (from web client)
  streamManager.on('message:send', (connId, message) => {
    // Send message to actual WebSocket client
    webSocketClient.send(JSON.stringify(message));
  });

  // Available stream channels
  const channels = streamManager.getAvailableChannels();
  /*
  [
    {
      name: 'container_stats',
      type: 'container_stats',
      description: 'Real-time container statistics',
      defaultInterval: 1000,
      requiresHostId: true,
      requiresContainerId: true,
    },
    {
      name: 'host_metrics',
      type: 'host_metrics',
      description: 'Host system metrics',
      defaultInterval: 5000,
      requiresHostId: true,
      requiresContainerId: false,
    },
    {
      name: 'all_stats',
      type: 'all_stats',
      description: 'Combined container stats and host metrics',
      defaultInterval: 5000,
      requiresHostId: false,
      requiresContainerId: false,
    },
    // ... more channels
  ]
  */

  // Handle WebSocket messages from client
  webSocket.on('message', (message) => {
    streamManager.handleMessage(connectionId, message);
  });

  // Example subscription message from client:
  const subscribeMessage = {
    id: 'sub-1',
    type: 'subscribe',
    channel: 'container_stats',
    data: {
      hostId: 1,
      containerId: 'container_id',
      interval: 1000,
    },
  };

  // Example all_stats subscription (no hostId or containerId required):
  const allStatsSubscribeMessage = {
    id: 'sub-2',
    type: 'subscribe',
    channel: 'all_stats',
    data: {
      interval: 5000,
    },
  };

  streamManager.handleMessage(connectionId, JSON.stringify(subscribeMessage));

  // Close connection when WebSocket closes
  webSocket.on('close', () => {
    streamManager.closeConnection(connectionId);
  });
}
```

## System Operations

```typescript
// Get system information
const systemInfo = await dockerClient.getSystemInfo(1);
console.log(`Server Version: ${systemInfo.ServerVersion}`);
console.log(`Storage Driver: ${systemInfo.Driver}`);

// Get Docker version
const version = await dockerClient.getSystemVersion(1);
console.log(`Docker Version: ${version.Version}`);
console.log(`API Version: ${version.ApiVersion}`);

// Get disk usage
const diskUsage = await dockerClient.getDiskUsage(1);
console.log(`Images: ${diskUsage.Images?.length || 0}`);
console.log(`Containers: ${diskUsage.Containers?.length || 0}`);
console.log(`Volumes: ${diskUsage.Volumes?.length || 0}`);

// System cleanup (removes unused containers, networks, images, volumes)
const pruneResult = await dockerClient.pruneSystem(1);
console.log(`Freed space: ${pruneResult.SpaceReclaimed} bytes`);
```

## Image Operations

```typescript
// List images on a host
const images = await dockerClient.getImages(1);
console.log(`Found ${images.length} images`);

// Pull an image
await dockerClient.pullImage(1, 'nginx:latest');
console.log('Image pulled successfully');
```

## Network and Volume Operations

```typescript
// List networks
const networks = await dockerClient.getNetworks(1);
console.log(`Networks: ${networks.map(n => n.Name).join(', ')}`);

// List volumes
const volumes = await dockerClient.getVolumes(1);
console.log(`Volumes: ${volumes.map(v => v.Name).join(', ')}`);
```

## Health Checks

```typescript
// Check health of a specific host
const isHealthy = await dockerClient.checkHostHealth(1);
console.log(`Host 1 is ${isHealthy ? 'healthy' : 'unhealthy'}`);

// Check health of all hosts
const healthResults = await dockerClient.checkAllHostsHealth();
Object.entries(healthResults).forEach(([hostId, healthy]) => {
  console.log(`Host ${hostId}: ${healthy ? 'Healthy' : 'Unhealthy'}`);
});
```

## Utility Functions

```typescript
import {
  formatBytes,
  formatCpuPercentage,
  formatMemoryPercentage,
  formatUptime,
  calculateCpuUsage,
  calculateMemoryUsage,
  calculateNetworkIO,
  calculateBlockIO,
  getContainerStatusInfo,
  isContainerHealthy,
  isHostHealthy,
  generateContainerSummary,
  generateHostSummary,
  parseImageName,
  isValidContainerName,
  isValidImageName,
  sanitizeName,
} from '@dockstat/docker-client/utils/docker-helpers';

// Format utilities
console.log(formatBytes(1024 * 1024 * 1024)); // "1.00 GB"
console.log(formatCpuPercentage(85.67)); // "85.67%"
console.log(formatUptime(3661)); // "1h 1m 1s"

// Container health check
const healthInfo = isContainerHealthy(containerStats);
if (!healthInfo.healthy) {
  console.log('Container issues:', healthInfo.issues);
}

// Parse image name
const imageInfo = parseImageName('registry.example.com/namespace/app:v1.0.0');
console.log(imageInfo); // { registry: 'registry.example.com', namespace: 'namespace', repository: 'app', tag: 'v1.0.0' }
```

## Configuration Options

```typescript
interface DockerClientOptions {
  defaultTimeout?: number;           // Default: 5000ms
  retryAttempts?: number;           // Default: 3
  retryDelay?: number;              // Default: 1000ms
  enableMonitoring?: boolean;       // Default: true
  enableEventEmitter?: boolean;     // Default: true
  monitoringOptions?: {
    healthCheckInterval?: number;              // Default: 30000ms
    containerEventPollingInterval?: number;   // Default: 5000ms
    hostMetricsInterval?: number;             // Default: 10000ms
    enableContainerEvents?: boolean;          // Default: true
    enableHostMetrics?: boolean;              // Default: true
    enableHealthChecks?: boolean;             // Default: true
  };
}
```

## Error Handling

The Docker client includes comprehensive error handling with retry mechanisms and detailed error reporting.

```typescript
try {
  const containers = await dockerClient.getAllContainers();
} catch (error) {
  if (error.message.includes('ECONNREFUSED')) {
    console.error('Docker daemon is not running or not accessible');
  } else if (error.message.includes('timeout')) {
    console.error('Operation timed out');
  } else {
    console.error('Unexpected error:', error.message);
  }
}

// Listen to error events for global error handling
dockerClient.events.on('error', (error, context) => {
  console.error('Global error:', error.message);
  console.error('Context:', context);
  
  // Implement your error reporting/logging here
});
```

## Testing

Run the built-in tests:

```bash
# Basic functionality tests
bun run test.ts --basic

# Advanced features demo
bun run test.ts --advanced

# Error handling demo
bun run test.ts --errors

# Run all tests
bun run test.ts --all
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode with watch
bun run dev

# Build the package
bun run build

# Type checking
bun run check-types

# Linting
bun run lint

# Run tests
bun run test
```

## API Reference

### DockerClient

The main class that provides all Docker operations.

#### Constructor
- `new DockerClient(options?: DockerClientOptions)`

#### Host Management
- `addHost(host: DATABASE.DB_target_host): void`
- `removeHost(host: DATABASE.DB_target_host): void`
- `updateHost(oldHost: DATABASE.DB_target_host, newHost: DATABASE.DB_target_host): void`
- `getHosts(): DATABASE.DB_target_host[]`

#### Container Operations
- `getAllContainers(): Promise<ContainerInfo[]>`
- `getContainersForHost(hostId: number): Promise<ContainerInfo[]>`
- `getContainer(hostId: number, containerId: string): Promise<ContainerInfo>`
- `startContainer(hostId: number, containerId: string): Promise<void>`
- `stopContainer(hostId: number, containerId: string): Promise<void>`
- `restartContainer(hostId: number, containerId: string): Promise<void>`
- `pauseContainer(hostId: number, containerId: string): Promise<void>`
- `unpauseContainer(hostId: number, containerId: string): Promise<void>`
- `killContainer(hostId: number, containerId: string, signal?: string): Promise<void>`
- `removeContainer(hostId: number, containerId: string, force?: boolean): Promise<void>`
- `renameContainer(hostId: number, containerId: string, newName: string): Promise<void>`

#### Container Statistics
- `getAllContainerStats(): Promise<ContainerStatsInfo[]>`
- `getContainerStatsForHost(hostId: number): Promise<ContainerStatsInfo[]>`
- `getContainerStats(hostId: number, containerId: string): Promise<ContainerStatsInfo>`
- `getAllStats(): Promise<AllStatsResponse>`

#### Host Metrics
- `getAllHostMetrics(): Promise<HostMetrics[]>`
- `getHostMetrics(hostId: number): Promise<HostMetrics>`

#### Monitoring
- `startMonitoring(): void`
- `stopMonitoring(): void`
- `isMonitoring(): boolean`

#### Streaming
- `startContainerStatsStream(hostId: number, containerId: string, callback: StreamCallback, interval?: number): string`
- `startHostMetricsStream(hostId: number, callback: StreamCallback, interval?: number): string`
- `startAllContainersStream(callback: StreamCallback, interval?: number): string`
- `startAllStatsStream(callback: StreamCallback, interval?: number): string`
- `stopStream(streamKey: string): boolean`
- `stopAllStreams(): void`
- `getActiveStreams(): string[]`

#### System Operations
- `getSystemInfo(hostId: number): Promise<Dockerode.SystemInfo>`
- `getSystemVersion(hostId: number): Promise<Dockerode.SystemVersion>`
- `getDiskUsage(hostId: number): Promise<Dockerode.SystemDfResponse>`
- `pruneSystem(hostId: number): Promise<Dockerode.SystemPruneResponse>`

#### Health Checks
- `checkHostHealth(hostId: number): Promise<boolean>`
- `checkAllHostsHealth(): Promise<Record<number, boolean>>`

## License

This package is part of the DockStat project. See the main repository for license information.

## Contributing

Contributions are welcome! Please read the contributing guidelines in the main repository.

## Support

For issues and questions, please use the GitHub issues page in the main DockStat repository.