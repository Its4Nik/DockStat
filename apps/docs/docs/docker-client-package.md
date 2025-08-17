# Docker Client Package (@dockstat/docker-client)

The `@dockstat/docker-client` package provides a powerful, type-safe Docker API client built on top of Dockerode, designed specifically for the DockStat ecosystem's monitoring and management needs.

## 🏗️ Architecture

### Tech Stack

- **Runtime**: Bun native
- **Docker API**: Dockerode v4.0.7
- **Types**: `@dockstat/typings`
- **Language**: TypeScript (strict mode)
- **Protocol**: Docker Engine API v1.41+

### Key Dependencies

```json
{
  "@dockstat/typings": "workspace:*",
  "dockerode": "^4.0.7"
}
```

## 🚀 Features

### Core Functionality

- **Multi-Host Support**: Connect to multiple Docker hosts simultaneously
- **Real-time Monitoring**: Live container and host statistics
- **Container Management**: Full lifecycle management (start, stop, restart, remove)
- **Image Operations**: Pull, build, and manage Docker images
- **Network Management**: Create and manage Docker networks
- **Volume Operations**: Handle Docker volumes and mounts
- **Events Streaming**: Real-time Docker events via EventEmitter
- **WebSocket Integration**: Built-in WebSocket support for live updates
- **Error Handling**: Comprehensive error handling and retry logic
- **Connection Pooling**: Efficient connection management

### Supported Operations

```typescript
interface DockerClientOperations {
  // Container operations
  listContainers(options?: ContainerListOptions): Promise<ContainerInfo[]>;
  getContainer(id: string): Promise<ContainerDetails>;
  startContainer(id: string): Promise<void>;
  stopContainer(id: string, timeout?: number): Promise<void>;
  restartContainer(id: string, timeout?: number): Promise<void>;
  removeContainer(id: string, options?: RemoveOptions): Promise<void>;
  getContainerStats(id: string): Promise<ContainerStats>;
  getContainerLogs(id: string, options?: LogOptions): Promise<string>;
  
  // Host operations
  getSystemInfo(): Promise<SystemInfo>;
  getSystemVersion(): Promise<SystemVersion>;
  getSystemUsage(): Promise<SystemUsage>;
  
  // Image operations
  listImages(options?: ImageListOptions): Promise<ImageInfo[]>;
  pullImage(name: string, options?: PullOptions): Promise<void>;
  removeImage(id: string, options?: RemoveImageOptions): Promise<void>;
  
  // Network operations
  listNetworks(): Promise<NetworkInfo[]>;
  createNetwork(options: CreateNetworkOptions): Promise<NetworkInfo>;
  removeNetwork(id: string): Promise<void>;
  
  // Volume operations
  listVolumes(): Promise<VolumeInfo[]>;
  createVolume(options: CreateVolumeOptions): Promise<VolumeInfo>;
  removeVolume(name: string): Promise<void>;
  
  // Events
  getEvents(options?: EventOptions): Promise<EventEmitter>;
}
```

## 📁 Project Structure

```
packages/docker-client/
├── src/
│   ├── client/              # Core client implementation
│   │   ├── DockerClient.ts  # Main client class
│   │   ├── Connection.ts    # Connection management
│   │   └── EventHandler.ts  # Event handling
│   ├── operations/          # Operation implementations
│   │   ├── containers.ts    # Container operations
│   │   ├── hosts.ts         # Host operations
│   │   ├── images.ts        # Image operations
│   │   ├── networks.ts      # Network operations
│   │   └── volumes.ts       # Volume operations
│   ├── monitoring/          # Monitoring utilities
│   │   ├── StatsCollector.ts # Statistics collection
│   │   ├── EventStream.ts   # Event streaming
│   │   └── HealthCheck.ts   # Health monitoring
│   ├── utils/               # Utility functions
│   │   ├── retry.ts         # Retry logic
│   │   ├── validation.ts    # Input validation
│   │   └── formatting.ts    # Data formatting
│   ├── websocket/           # WebSocket integration
│   │   ├── WebSocketServer.ts # WebSocket server
│   │   └── StatsStreamer.ts # Real-time stats streaming
│   ├── types.ts             # Package-specific types
│   └── index.ts             # Main exports
├── examples/                # Usage examples
│   ├── basic-usage.ts       # Basic client usage
│   └── websocket-integration.ts # WebSocket example
├── tests/                   # Test files
├── build.ts                 # Build configuration
└── package.json             # Package configuration
```

## 🛠️ Core Implementation

### Docker Client Class

```typescript
export class DockerClient {
  private docker: Dockerode;
  private hostInfo: HostInfo;
  private eventEmitter: EventEmitter;
  private statsCollector: StatsCollector;
  
  constructor(options: DockerClientOptions) {
    this.docker = new Dockerode({
      host: options.host || 'localhost',
      port: options.port || 2376,
      protocol: options.secure ? 'https' : 'http',
      timeout: options.timeout || 30000,
      ...options.dockerodeOptions
    });
    
    this.hostInfo = {
      id: options.hostId || `${options.host}:${options.port}`,
      name: options.name || options.host,
      address: options.host,
      port: options.port,
      secure: options.secure || false
    };
    
    this.eventEmitter = new EventEmitter();
    this.statsCollector = new StatsCollector(this.docker);
  }
  
  async connect(): Promise<void> {
    try {
      // Test connection
      await this.docker.ping();
      
      // Get system information
      const systemInfo = await this.docker.info();
      this.hostInfo.systemInfo = systemInfo;
      
      // Start event monitoring
      await this.startEventMonitoring();
      
      this.eventEmitter.emit('connected', this.hostInfo);
    } catch (error) {
      this.eventEmitter.emit('error', {
        host: this.hostInfo,
        error: error.message
      });
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    this.statsCollector.stop();
    this.eventEmitter.emit('disconnected', this.hostInfo);
  }
  
  getHostInfo(): HostInfo {
    return this.hostInfo;
  }
  
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
}
```

### Container Operations

```typescript
export class ContainerOperations {
  constructor(private docker: Dockerode, private eventEmitter: EventEmitter) {}
  
  async listContainers(options: ContainerListOptions = {}): Promise<ContainerInfo[]> {
    try {
      const containers = await this.docker.listContainers({
        all: options.all || false,
        filters: options.filters
      });
      
      return containers.map(container => this.formatContainerInfo(container));
    } catch (error) {
      this.handleError('listContainers', error);
      throw error;
    }
  }
  
  async getContainer(id: string): Promise<ContainerDetails> {
    try {
      const container = this.docker.getContainer(id);
      const [info, stats] = await Promise.all([
        container.inspect(),
        this.getContainerStats(id)
      ]);
      
      return {
        ...this.formatContainerInfo(info),
        stats,
        config: info.Config,
        hostConfig: info.HostConfig,
        networkSettings: info.NetworkSettings
      };
    } catch (error) {
      this.handleError('getContainer', error, { containerId: id });
      throw error;
    }
  }
  
  async startContainer(id: string): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.start();
      
      this.eventEmitter.emit('containerStarted', {
        containerId: id,
        timestamp: new Date()
      });
    } catch (error) {
      this.handleError('startContainer', error, { containerId: id });
      throw error;
    }
  }
  
  async stopContainer(id: string, timeout: number = 10): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.stop({ t: timeout });
      
      this.eventEmitter.emit('containerStopped', {
        containerId: id,
        timestamp: new Date()
      });
    } catch (error) {
      this.handleError('stopContainer', error, { containerId: id });
      throw error;
    }
  }
  
  async restartContainer(id: string, timeout: number = 10): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.restart({ t: timeout });
      
      this.eventEmitter.emit('containerRestarted', {
        containerId: id,
        timestamp: new Date()
      });
    } catch (error) {
      this.handleError('restartContainer', error, { containerId: id });
      throw error;
    }
  }
  
  async removeContainer(id: string, options: RemoveOptions = {}): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.remove({
        force: options.force || false,
        v: options.removeVolumes || false
      });
      
      this.eventEmitter.emit('containerRemoved', {
        containerId: id,
        timestamp: new Date()
      });
    } catch (error) {
      this.handleError('removeContainer', error, { containerId: id });
      throw error;
    }
  }
  
  async getContainerStats(id: string): Promise<ContainerStats> {
    try {
      const container = this.docker.getContainer(id);
      const stats = await container.stats({ stream: false });
      
      return this.formatContainerStats(stats);
    } catch (error) {
      this.handleError('getContainerStats', error, { containerId: id });
      throw error;
    }
  }
  
  async getContainerLogs(id: string, options: LogOptions = {}): Promise<string> {
    try {
      const container = this.docker.getContainer(id);
      const logs = await container.logs({
        stdout: options.stdout !== false,
        stderr: options.stderr !== false,
        timestamps: options.timestamps || false,
        tail: options.tail || 'all',
        since: options.since,
        until: options.until
      });
      
      return logs.toString();
    } catch (error) {
      this.handleError('getContainerLogs', error, { containerId: id });
      throw error;
    }
  }
  
  private formatContainerInfo(container: any): ContainerInfo {
    return {
      id: container.Id,
      name: container.Names?.[0]?.replace(/^\//, '') || 'unknown',
      image: container.Image,
      imageId: container.ImageID,
      command: container.Command,
      created: new Date(container.Created * 1000),
      state: container.State,
      status: container.Status,
      ports: container.Ports?.map(port => ({
        privatePort: port.PrivatePort,
        publicPort: port.PublicPort,
        type: port.Type,
        ip: port.IP
      })) || [],
      labels: container.Labels || {},
      networkMode: container.HostConfig?.NetworkMode,
      mounts: container.Mounts?.map(mount => ({
        type: mount.Type,
        source: mount.Source,
        destination: mount.Destination,
        mode: mount.Mode,
        readWrite: mount.RW
      })) || []
    };
  }
  
  private formatContainerStats(stats: any): ContainerStats {
    const cpuStats = stats.cpu_stats;
    const preCpuStats = stats.precpu_stats;
    const memoryStats = stats.memory_stats;
    const networkStats = stats.networks;
    const blockStats = stats.blkio_stats;
    
    // Calculate CPU usage percentage
    const cpuDelta = cpuStats.cpu_usage.total_usage - preCpuStats.cpu_usage.total_usage;
    const systemDelta = cpuStats.system_cpu_usage - preCpuStats.system_cpu_usage;
    const cpuUsage = systemDelta > 0 ? (cpuDelta / systemDelta) * cpuStats.online_cpus * 100 : 0;
    
    // Calculate network stats
    let networkRx = 0;
    let networkTx = 0;
    if (networkStats) {
      Object.values(networkStats).forEach((network: any) => {
        networkRx += network.rx_bytes || 0;
        networkTx += network.tx_bytes || 0;
      });
    }
    
    // Calculate disk I/O
    let diskRead = 0;
    let diskWrite = 0;
    if (blockStats?.io_service_bytes_recursive) {
      blockStats.io_service_bytes_recursive.forEach((item: any) => {
        if (item.op === 'Read') diskRead += item.value;
        if (item.op === 'Write') diskWrite += item.value;
      });
    }
    
    return {
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      memoryUsage: memoryStats.usage || 0,
      memoryLimit: memoryStats.limit || 0,
      memoryPercentage: memoryStats.limit ? 
        Math.round((memoryStats.usage / memoryStats.limit) * 10000) / 100 : 0,
      networkRx,
      networkTx,
      diskRead,
      diskWrite,
      pids: stats.pids_stats?.current || 0,
      timestamp: new Date()
    };
  }
  
  private handleError(operation: string, error: any, context?: any): void {
    this.eventEmitter.emit('operationError', {
      operation,
      error: error.message,
      context,
      timestamp: new Date()
    });
  }
}
```

### Statistics Collector

```typescript
export class StatsCollector {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private eventEmitter: EventEmitter;
  
  constructor(
    private docker: Dockerode,
    eventEmitter: EventEmitter
  ) {
    this.eventEmitter = eventEmitter;
  }
  
  async startCollecting(containerId: string, interval: number = 5000): Promise<void> {
    if (this.intervals.has(containerId)) {
      this.stopCollecting(containerId);
    }
    
    const collect = async () => {
      try {
        const container = this.docker.getContainer(containerId);
        const stats = await container.stats({ stream: false });
        
        this.eventEmitter.emit('containerStats', {
          containerId,
          stats: this.formatStats(stats),
          timestamp: new Date()
        });
      } catch (error) {
        this.eventEmitter.emit('statsError', {
          containerId,
          error: error.message,
          timestamp: new Date()
        });
      }
    };
    
    // Collect immediately
    await collect();
    
    // Set up interval collection
    const intervalId = setInterval(collect, interval);
    this.intervals.set(containerId, intervalId);
  }
  
  stopCollecting(containerId: string): void {
    const intervalId = this.intervals.get(containerId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(containerId);
    }
  }
  
  stopAll(): void {
    for (const [containerId] of this.intervals) {
      this.stopCollecting(containerId);
    }
  }
  
  isCollecting(containerId: string): boolean {
    return this.intervals.has(containerId);
  }
  
  getCollectingContainers(): string[] {
    return Array.from(this.intervals.keys());
  }
  
  private formatStats(stats: any): ContainerStats {
    // Implementation similar to ContainerOperations.formatContainerStats
    // ... (stats formatting logic)
  }
}
```

### WebSocket Integration

```typescript
export class DockerWebSocketStreamer {
  private server: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private statsCollectors: Map<string, StatsCollector> = new Map();
  
  constructor(
    private dockerClients: Map<string, DockerClient>,
    options: WebSocketOptions = {}
  ) {
    this.server = new WebSocketServer({
      port: options.port || 8080,
      path: options.path || '/docker/stats'
    });
    
    this.setupWebSocketServer();
  }
  
  private setupWebSocketServer(): void {
    this.server.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.clients.add(ws);
      
      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to Docker stats stream',
        timestamp: new Date()
      }));
      
      // Handle messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            timestamp: new Date()
          }));
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }
  
  private handleWebSocketMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'subscribe':
        this.handleSubscribe(ws, data);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, data);
        break;
      case 'listContainers':
        this.handleListContainers(ws, data);
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`,
          timestamp: new Date()
        }));
    }
  }
  
  private async handleSubscribe(ws: WebSocket, data: any): Promise<void> {
    const { hostId, containerId } = data;
    
    const dockerClient = this.dockerClients.get(hostId);
    if (!dockerClient) {
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown host: ${hostId}`,
        timestamp: new Date()
      }));
      return;
    }
    
    try {
      // Set up stats collection for this container
      const statsKey = `${hostId}:${containerId}`;
      if (!this.statsCollectors.has(statsKey)) {
        const collector = new StatsCollector(dockerClient.docker, dockerClient.eventEmitter);
        this.statsCollectors.set(statsKey, collector);
        
        // Forward stats to WebSocket clients
        dockerClient.on('containerStats', (statsData) => {
          if (statsData.containerId === containerId) {
            this.broadcast({
              type: 'containerStats',
              hostId,
              containerId,
              stats: statsData.stats,
              timestamp: statsData.timestamp
            });
          }
        });
        
        await collector.startCollecting(containerId);
      }
      
      ws.send(JSON.stringify({
        type: 'subscribed',
        hostId,
        containerId,
        timestamp: new Date()
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: `Failed to subscribe: ${error.message}`,
        timestamp: new Date()
      }));
    }
  }
  
  private handleUnsubscribe(ws: WebSocket, data: any): void {
    const { hostId, containerId } = data;
    const statsKey = `${hostId}:${containerId}`;
    
    const collector = this.statsCollectors.get(statsKey);
    if (collector) {
      collector.stopCollecting(containerId);
      this.statsCollectors.delete(statsKey);
    }
    
    ws.send(JSON.stringify({
      type: 'unsubscribed',
      hostId,
      containerId,
      timestamp: new Date()
    }));
  }
  
  private async handleListContainers(ws: WebSocket, data: any): Promise<void> {
    const { hostId } = data;
    
    const dockerClient = this.dockerClients.get(hostId);
    if (!dockerClient) {
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown host: ${hostId}`,
        timestamp: new Date()
      }));
      return;
    }
    
    try {
      const containers = await dockerClient.listContainers();
      ws.send(JSON.stringify({
        type: 'containerList',
        hostId,
        containers,
        timestamp: new Date()
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: `Failed to list containers: ${error.message}`,
        timestamp: new Date()
      }));
    }
  }
  
  private broadcast(message: any): void {
    const messageString = JSON.stringify(message);
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    }
  }
  
  close(): void {
    // Stop all stats collectors
    for (const collector of this.statsCollectors.values()) {
      collector.stopAll();
    }
    
    // Close WebSocket server
    this.server.close();
  }
}
```

## 🧪 Usage Examples

### Basic Usage

```typescript
import { DockerClient } from '@dockstat/docker-client';

// Create client instance
const client = new DockerClient({
  host: 'localhost',
  port: 2375,
  hostId: 'local-docker',
  name: 'Local Docker Host'
});

// Connect to Docker host
await client.connect();

// List all containers
const containers = await client.listContainers({ all: true });
console.log('Containers:', containers);

// Get container details
const container = await client.getContainer('nginx-container');
console.log('Container details:', container);

// Start a container
await client.startContainer('nginx-container');

// Get real-time stats
client.on('containerStats', (data) => {
  console.log(`Stats for ${data.containerId}:`, data.stats);
});

// Handle errors
client.on('error', (error) => {
  console.error('Docker client error:', error);
});
```

### Multi-Host Management

```typescript
import { DockerClient, DockerWebSocketStreamer } from '@dockstat/docker-client';

// Create multiple Docker clients
const dockerClients = new Map<string, DockerClient>();

const hosts = [
  { id: 'host1', address: '192.168.1.10', port: 2375 },
  { id: 'host2', address: '192.168.1.11', port: 2375 },
  { id: 'host3', address: '192.168.1.12', port: 2375 }
];

// Connect to all hosts
for (const host of hosts) {
  const client = new DockerClient({
    host: host.address,
    port: host.port,
    hostId: host.id,
    name: `Docker Host ${host.id}`
  });
  
  try {
    await client.connect();
    dockerClients.set(host.id, client);
    console.log(`Connected to ${host.id}`);
  } catch (error) {
    console.error(`Failed to connect to ${host.id}:`, error.message);
  }
}

// Set up WebSocket streaming
const wsStreamer = new DockerWebSocketStreamer(dockerClients, {
  port: 8080,
  path: '/docker/stats'
});

// Get containers from all hosts
for (const [hostId, client] of dockerClients) {
  try {
    const containers = await client.listContainers();
    console.log(`${hostId} containers:`, containers.length);
  } catch (error) {
    console.error(`Error listing containers for ${hostId}:`, error.message);
  }
}
```

### Event Monitoring

```typescript
import { DockerClient } from '@dockstat/docker-client';

const client = new DockerClient({
  host: 'localhost',
  port: 2375
});

await client.connect();

// Monitor container lifecycle events
client.on('containerStarted', (event) => {
  console.log(`Container started: ${event.containerId}`);
});

client.on('containerStopped', (event) => {
  console.log(`Container stopped: ${event.containerId}`);
});

client.on('containerRemoved', (event) => {
  console.log(`Container removed: ${event.containerId}`);
});

// Monitor Docker events
const eventStream = await client.getEvents();
eventStream.on('data', (event) => {
  console.log('Docker event:', {
    type: event.Type,
    action: event.Action,
    actor: event.Actor,
    time: new Date(event.time * 1000)
  });
});
```

## 🔧 Configuration

### Client Options

```typescript
interface DockerClientOptions {
  host?: string;                    // Docker host address
  port?: number;                    // Docker host port
  hostId?: string;                  // Unique host identifier
  name?: string;                    // Display name for host
  secure?: boolean;                 // Use HTTPS/TLS
  timeout?: number;                 // Connection timeout (ms)
  maxRetries?: number;              // Max retry attempts
  retryDelay?: number;              // Delay between retries (ms)
  dockerodeOptions?: any;           // Additional Dockerode options
}
```

### WebSocket Options

```typescript
interface WebSocketOptions {
  port?: number;                    // WebSocket server port
  path?: string;                    // WebSocket endpoint path
  maxConnections?: number;          // Maximum concurrent connections
  heartbeatInterval?: number;       // Heartbeat interval (ms)
}
```

## 🧪 Testing

### Test Setup

```typescript
// tests/setup.ts
import { DockerClient } from '../src';

export function createTestClient(): DockerClient {
  return new DockerClient({
    host: process.env.DOCKER_HOST || 'localhost',
    port: parseInt(process.env.DOCKER_PORT || '2375'),
    hostId: 'test-host'
  });
}

export async function createTestContainer(): Promise<string> {
  const client = createTestClient();
  await client.connect();
  
  // Create test container
  const container = await client.docker.createContainer({
    Image: 'nginx:alpine',
    name: 'test-container-' + Date.now()
  });
  
  return container.id;
}
```

### Integration Tests

```typescript
// tests/integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { DockerClient } from '../src';
import { createTestClient, createTestContainer } from './setup';

describe('DockerClient Integration', () => {
  let client: DockerClient;
  let testContainerId: string;
  
  beforeAll(async () => {
    client = createTestClient();
    await client.connect();
    testContainerId = await createTestContainer();
  });
  
  afterAll(async () => {
    if (testContainerId) {
      await client.removeContainer(testContainerId, { force: true });
    }
    await client.disconnect();
  });
  
  it('should list containers', async () => {
    const containers = await client.listContainers();
    expect(Array.isArray(containers)).toBe(true);
  });
  
  it('should get container details', async () => {
    const container = await client.getContainer(testContainerId);
    expect(container.id).toBe(testContainerId);
  });
  
  it('should start and stop container', async () => {
    await client.startContainer(testContainerId);
    
    let container = await client.getContainer(testContainerId);
    expect(container.state).toBe('running');
    
    await client.stopContainer(testContainerId);
    
    container = await client.getContainer(testContainerId);
    expect(container.state).toBe('exited');
  });
  
  it('should get container stats', async () => {
    await client.startContainer(testContainerId);
    
    const stats = await client.getContainerStats(testContainerId);
    expect(stats).toBeDefined();
    expect(typeof stats.cpuUsage).toBe('number');
    expect(typeof stats.memoryUsage).toBe('number');
  });
});
```

## 🚀 Deployment

### NPM Publishing

```bash
# Build package
bun run build

# Test package
bun run test

# Publish to npm
npm publish
```

### Environment Variables

```bash
# Docker configuration
DOCKER_HOST=localhost
DOCKER_PORT=2375
DOCKER_SECURE=false
DOCKER_TIMEOUT=30000

# WebSocket configuration
WEBSOCKET_PORT=8080
WEBSOCKET_PATH=/docker/stats

# Monitoring configuration
STATS_INTERVAL=5000
MAX_RETRIES=3
RETRY_DELAY=1000
```

The `@dockstat/docker-client` package provides a comprehensive, type-safe interface for interacting with Docker hosts, enabling real-time monitoring, container management, and WebSocket-based streaming for the DockStat ecosystem.