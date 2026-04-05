---
id: ef12194c-404e-4bcd-a5b0-31aaf7b1b798
title: "@dockstat/docker-client"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: bbcefaa2-6bd4-46e8-ae4b-a6b823593e67
updatedAt: 2026-01-01T15:02:01.650Z
urlId: X0z5b9Ra01
---

> A comprehensive Docker client library for DockStat built on Dockerode. Provides real-time monitoring, multi-host management, streaming capabilities, and a worker pool architecture for scalable Docker operations.

## Overview

`@dockstat/docker-client` is the core Docker integration package for DockStat. It abstracts Docker operations, provides real-time container statistics, manages multiple Docker hosts, and offers event-driven monitoring capabilities.

```mermaidjs

graph TB
    subgraph "Application"
        API["DockStat API"]
    end

    subgraph "@dockstat/docker-client"
        DCM["DockerClientManager"]
        HH["HostHandler"]
        MM["MonitoringManager"]
        SM["StreamManager"]
        WP["Worker Pool"]
    end

    subgraph "Dependencies"
        DOCKERODE["Dockerode"]
        SW["@dockstat/sqlite-wrapper"]
        LOG["@dockstat/logger"]
    end

    subgraph "Docker Hosts"
        LOCAL["Local Docker"]
        REMOTE1["Remote Host 1"]
        REMOTE2["Remote Host 2"]
    end

    API --> DCM
    DCM --> HH
    DCM --> MM
    DCM --> WP
    MM --> SM
    HH --> SW
    DCM --> DOCKERODE
    WP --> LOCAL
    WP --> REMOTE1
    WP --> REMOTE2
```

## Installation

```bash
bun add @dockstat/docker-client
```

> **Note**: This is an internal package. For external use, ensure all peer dependencies are installed.

## Quick Start

```typescript
import DockerClient from "@dockstat/docker-client";
import DockStatDB from "@dockstat/db";

// Initialize database

const db = new DockStatDB();

// Create Docker client with monitoring

const client = new DockerClient(db.getDB(), {
  enableMonitoring: true,
  monitoringInterval: 5000
});

// Register a client

const clientId = await client.registerClient("production");

// Add a Docker host

await client.addHost({
  id: 1,
  clientId,
  host: "/var/run/docker.sock",
  name: "Local Docker",
  secure: false,
  port: 0
});

// Start monitoring

await client.startMonitoring(clientId);

// Get all containers

const containers = await client.getAllContainers(clientId);
console.log(`Found ${containers.length} containers`);
```

## Architecture

### Component Overview

```mermaidjs

graph TB
    subgraph "DockerClient"
        direction TB
        MAIN["Main Controller"]
        CONFIG["Configuration"]
        STATE["State Management"]
    end

    subgraph "HostHandler"
        direction TB
        HOSTS["Host Registry"]
        PERSIST["Persistence Layer"]
        HEALTH["Health Checks"]
    end

    subgraph "MonitoringManager"
        direction TB
        STATS["Stats Collection"]
        EVENTS["Event Handling"]
        INTERVALS["Interval Management"]
    end

    subgraph "StreamManager"
        direction TB
        WS["WebSocket Support"]
        CHANNELS["Channel Management"]
        BROADCAST["Broadcasting"]
    end

    subgraph "Worker Pool"
        direction TB
        WORKERS["Worker Threads"]
        QUEUE["Task Queue"]
        BALANCE["Load Balancing"]
    end

    MAIN --> CONFIG
    MAIN --> STATE
    MAIN --> HOSTS
    MAIN --> STATS
    MAIN --> WS
    MAIN --> WORKERS
    HOSTS --> PERSIST
    HOSTS --> HEALTH
    STATS --> EVENTS
    STATS --> INTERVALS
    WS --> CHANNELS
    WS --> BROADCAST
    WORKERS --> QUEUE
    WORKERS --> BALANCE
```

### Data Flow

```mermaidjs

sequenceDiagram
    participant App as "Application"
    participant DC as "DockerClient"
    participant HH as "HostHandler"
    participant MM as "MonitoringManager"
    participant WP as "Worker Pool"
    participant Docker as "Docker Daemon"

    App->>DC: "registerClient(name)"
    DC->>HH: "Create client entry"
    HH-->>DC: "clientId"
    DC-->>App: "clientId"

    App->>DC: "addHost(config)"
    DC->>HH: "Register host"
    DC->>WP: "Create worker for host"
    WP->>Docker: "Test connection"
    Docker-->>WP: "Connection OK"
    WP-->>DC: "Host ready"
    DC-->>App: "Host added"

    App->>DC: "startMonitoring(clientId)"
    DC->>MM: "Start monitoring loop"
    
    loop "Every interval"
        MM->>WP: "Request stats"
        WP->>Docker: "GET /containers/json"
        Docker-->>WP: "Container list"
        WP->>Docker: "GET /containers/:id/stats"
        Docker-->>WP: "Stats stream"
        WP-->>MM: "Aggregated stats"
        MM-->>App: "Emit stats event"
    end
```

## Core Features

### Multi-Host Management

Manage multiple Docker hosts from a single client instance:

```typescript
// Register the client

const clientId = await client.registerClient("multi-host");

// Add local Docker

await client.addHost({
  id: 1,
  clientId,
  host: "/var/run/docker.sock",
  name: "Local",
  secure: false,
  port: 0
});

// Add remote Docker (TCP)
await client.addHost({
  id: 2,
  clientId,
  host: "192.168.1.100",
  name: "Remote 1",
  secure: false,
  port: 2375
});

// Add remote Docker (TLS)
await client.addHost({
  id: 3,
  clientId,
  host: "production.docker.local",
  name: "Production",
  secure: true,
  port: 2376
});
```

### Real-Time Monitoring

```mermaidjs

graph LR
    subgraph "Monitoring Flow"
        INTERVAL["Interval Timer"]
        COLLECT["Stats Collection"]
        PROCESS["Data Processing"]
        EMIT["Event Emission"]
    end

    subgraph "Data Types"
        CPU["CPU Usage"]
        MEM["Memory Usage"]
        NET["Network I/O"]
        DISK["Disk I/O"]
    end

    INTERVAL --> COLLECT
    COLLECT --> PROCESS
    PROCESS --> EMIT
    EMIT --> CPU
    EMIT --> MEM
    EMIT --> NET
    EMIT --> DISK
```

```typescript
import DockerClient, { MonitoringManager } from "@dockstat/docker-client";

const client = new DockerClient(db.getDB(), {
  enableMonitoring: true,
  monitoringInterval: 5000  // 5 seconds
});

// Start monitoring

await client.startMonitoring(clientId);

// Listen for stats updates

client.on("stats", (stats) => {
  console.log("Container stats:", stats);
});

// Listen for container events

client.on("container:start", (container) => {
  console.log("Container started:", container.Id);
});

client.on("container:stop", (container) => {
  console.log("Container stopped:", container.Id);
});

// Stop monitoring when done

await client.stopMonitoring(clientId);
```

### Container Statistics

```typescript
// Get all containers with stats

const containers = await client.getAllContainers(clientId);

for (const container of containers) {
  console.log(`
    Container: ${container.Names[0]}
    Image: ${container.Image}
    State: ${container.State}
    Status: ${container.Status}
    CPU: ${container.stats?.cpu_percent}%
    Memory: ${container.stats?.memory_usage}MB / ${container.stats?.memory_limit}MB
    Network RX: ${container.stats?.network_rx}
    Network TX: ${container.stats?.network_tx}
  `);
}
```

### Streaming

```mermaidjs

sequenceDiagram
    participant Client as "Client"
    participant SM as "StreamManager"
    participant WS as "WebSocket"
    participant Subscriber as "Subscriber"

    Client->>SM: "subscribe(channel, handler)"
    SM->>SM: "Register handler"
    SM-->>Client: "Subscription ID"

    loop "Data Available"
        WS->>SM: "Incoming data"
        SM->>SM: "Route to channel"
        SM->>Subscriber: "Call handler(data)"
    end

    Client->>SM: "unsubscribe(channel, handler)"
    SM->>SM: "Remove handler"
```

```typescript
import { StreamManager, STREAM_CHANNELS } from "@dockstat/docker-client";

const streamManager = new StreamManager();

// Subscribe to container stats

const unsubscribe = streamManager.subscribe(
  STREAM_CHANNELS.CONTAINER_STATS,
  (stats) => {
    console.log("Real-time stats:", stats);
  }
);

// Subscribe to container events

streamManager.subscribe(
  STREAM_CHANNELS.CONTAINER_EVENTS,
  (event) => {
    console.log("Container event:", event.Action, event.Actor.ID);
  }
);

// Subscribe to Docker daemon events

streamManager.subscribe(
  STREAM_CHANNELS.DOCKER_EVENTS,
  (event) => {
    console.log("Docker event:", event);
  }
);

// Unsubscribe when done

unsubscribe();
```

### Stream Channels

| Channel | Description |
|---------|-------------|
| `CONTAINER_STATS` | Real-time container statistics |
| `CONTAINER_EVENTS` | Container lifecycle events |
| `DOCKER_EVENTS` | All Docker daemon events |
| `IMAGE_EVENTS` | Image-related events |
| `NETWORK_EVENTS` | Network-related events |
| `VOLUME_EVENTS` | Volume-related events |

## Worker Pool

The worker pool architecture enables scalable multi-host management:

```mermaidjs

graph TB
    subgraph "Worker Pool"
        MANAGER["Pool Manager"]
        W1["Worker 1"]
        W2["Worker 2"]
        W3["Worker 3"]
        WN["Worker N"]
    end

    subgraph "Hosts"
        H1["Host A"]
        H2["Host B"]
        H3["Host C"]
        HN["Host N"]
    end

    MANAGER --> W1
    MANAGER --> W2
    MANAGER --> W3
    MANAGER --> WN
    W1 --> H1
    W2 --> H2
    W3 --> H3
    WN --> HN
```

```typescript
// Get worker pool statistics
const status = await client.getStatus();

console.log(`
  Total Workers: ${status.totalWorkers}
  Active Workers: ${status.activeWorkers}
  Total Hosts: ${status.totalHosts}
  Average Hosts/Worker: ${status.averageHostsPerWorker}
`);

for (const worker of status.workers) {
  console.log(`
    Worker ${worker.workerId}:
      Client: ${worker.clientName}
      Hosts: ${worker.hostsManaged}
      Active Streams: ${worker.activeStreams}
      Monitoring: ${worker.isMonitoring}
      Uptime: ${worker.uptime}s
      Memory: ${Math.round(worker.memoryUsage.heapUsed / 1024 / 1024)}MB
  `);
}
```

### Worker Configuration

```typescript
// Configure max workers via environment variable
// DOCKSTAT_MAX_WORKERS=200

const client = new DockerClient(db.getDB(), {
  enableMonitoring: true,
  maxWorkers: parseInt(process.env.DOCKSTAT_MAX_WORKERS || "200")
});
```

## Host Handler

The HostHandler manages Docker host registration and persistence:

```typescript
import { HostHandler } from "@dockstat/docker-client";

const hostHandler = new HostHandler(db);

// Get all hosts
const hosts = hostHandler.getAll();

// Get hosts for a specific client
const clientHosts = hostHandler.getByClient(clientId);

// Update host configuration
hostHandler.update({
  id: 1,
  clientId,
  host: "192.168.1.101",
  name: "Updated Host",
  secure: true,
  port: 2376
});

// Remove host
hostHandler.remove(hostId);
```

### Host Health Checks

```typescript
// Check host connectivity
const isHealthy = await client.checkHostHealth(hostId);

// Get host with health status
const hostsWithHealth = await client.getHostsWithHealth(clientId);

for (const host of hostsWithHealth) {
  console.log(`
    Host: ${host.name}
    Status: ${host.healthy ? "Healthy" : "Unhealthy"}
    Last Check: ${host.lastHealthCheck}
    Error: ${host.healthError || "None"}
  `);
}
```

## Container Operations

### List Containers

```typescript
// All containers (including stopped)
const all = await client.getAllContainers(clientId);

// Running containers only
const running = await client.getRunningContainers(clientId);

// Filter by label
const filtered = await client.getContainersByLabel(
  clientId,
  "com.docker.compose.project",
  "myproject"
);
```

### Container Actions

```typescript
// Start container
await client.startContainer(clientId, containerId);

// Stop container
await client.stopContainer(clientId, containerId);

// Restart container
await client.restartContainer(clientId, containerId);

// Remove container
await client.removeContainer(clientId, containerId, { force: true });

// Get container logs
const logs = await client.getContainerLogs(clientId, containerId, {
  tail: 100,
  since: Date.now() - 3600000  // Last hour
});
```

### Container Inspection

```typescript
// Get detailed container info
const inspect = await client.inspectContainer(clientId, containerId);

console.log(`
  ID: ${inspect.Id}
  Name: ${inspect.Name}
  Image: ${inspect.Config.Image}
  Created: ${inspect.Created}
  State: ${inspect.State.Status}
  Running: ${inspect.State.Running}
  Ports: ${JSON.stringify(inspect.NetworkSettings.Ports)}
  Mounts: ${inspect.Mounts.map(m => `${m.Source}:${m.Destination}`).join(", ")}
`);
```

## API Reference

### DockerClient Constructor

```typescript
new DockerClient(db: DB, options?: DockerClientOptions)
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableMonitoring` | `boolean` | `false` | Enable real-time monitoring |
| `monitoringInterval` | `number` | `5000`  | Stats collection interval (ms) |
| `maxWorkers` | `number` | `200`   | Maximum worker threads |
| `maxRetries` | `number` | `3`     | Connection retry attempts |
| `retryDelay` | `number` | `1000`  | Delay between retries (ms) |

### Client Management

| Method | Description |
|--------|-------------|
| `registerClient(name, options?)` | Register a new Docker client |
| `removeClient(clientId)` | Remove a client and all hosts |
| `getClients()` | Get all registered clients |
| `getClient(clientId)` | Get specific client |

### Host Management

| Method | Description |
|--------|-------------|
| `addHost(config)` | Add a Docker host |
| `updateHost(config)` | Update host configuration |
| `removeHost(hostId)` | Remove a host |
| `getHosts(clientId)` | Get hosts for a client |
| `getHostsWithHealth(clientId)` | Get hosts with health status |
| `checkHostHealth(hostId)` | Check host connectivity |

### Monitoring

| Method | Description |
|--------|-------------|
| `startMonitoring(clientId)` | Start monitoring for a client |
| `stopMonitoring(clientId)` | Stop monitoring for a client |
| `stopAllMonitoring()` | Stop all monitoring |
| `isMonitoring(clientId)` | Check if monitoring is active |

### Container Operations

| Method | Description |
|--------|-------------|
| `getAllContainers(clientId)` | Get all containers |
| `getRunningContainers(clientId)` | Get running containers |
| `inspectContainer(clientId, containerId)` | Get container details |
| `startContainer(clientId, containerId)` | Start a container |
| `stopContainer(clientId, containerId)` | Stop a container |
| `restartContainer(clientId, containerId)` | Restart a container |
| `removeContainer(clientId, containerId, opts?)` | Remove a container |
| `getContainerLogs(clientId, containerId, opts?)` | Get container logs |

### Status

| Method | Description |
|--------|-------------|
| `getStatus()` | Get overall client status |
| `getPoolStats()` | Get worker pool statistics |

## Events

The DockerClient emits various events:

```typescript
// Container events
client.on("container:start", (container) => { });
client.on("container:stop", (container) => { });
client.on("container:die", (container) => { });
client.on("container:restart", (container) => { });
client.on("container:create", (container) => { });
client.on("container:destroy", (container) => { });

// Image events
client.on("image:pull", (image) => { });
client.on("image:delete", (image) => { });

// Stats events
client.on("stats", (stats) => { });
client.on("stats:error", (error) => { });

// Connection events
client.on("host:connected", (host) => { });
client.on("host:disconnected", (host) => { });
client.on("host:error", (host, error) => { });
```

## Type Definitions

```typescript
import type { DOCKER } from "@dockstat/typings";

// Host configuration

type HostConfig = DOCKER.HostConfig;
/*
{
  id: number;
  clientId?: number;
  host: string;
  port: number;
  secure: boolean;
  name: string;
}
*/

// Container with stats

type Container = DOCKER.Container;
/*
{
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  State: string;
  Status: string;
  Ports: Port[];
  Labels: Record<string, string>;
  stats?: ContainerStats;
}
*/

// Container statistics

type ContainerStats = DOCKER.ContainerStats;
/*
{
  cpu_percent: number;
  memory_usage: number;
  memory_limit: number;
  memory_percent: number;
  network_rx: number;
  network_tx: number;
  block_read: number;
  block_write: number;
}
*/
```

## Error Handling

```typescript
import DockerClient from "@dockstat/docker-client";
import Logger from "@dockstat/logger";

const log = new Logger("Docker");

try {
  const containers = await client.getAllContainers(clientId);
} catch (error) {
  if (error.code === "ENOENT") {
    log.error("Docker socket not found");
  } else if (error.code === "ECONNREFUSED") {
    log.error("Docker daemon not running");
  } else if (error.code === "ETIMEDOUT") {
    log.error("Connection to Docker host timed out");
  } else {
    log.error(`Docker error: ${error.message}`);
  }
}

// Handle monitoring errors
client.on("stats:error", (error) => {
  log.error(`Monitoring error: ${error.message}`);
});

client.on("host:error", (host, error) => {
  log.error(`Host ${host.name} error: ${error.message}`);
});
```

## Integration Examples

### With DockStat API

```typescript
import { Elysia } from "elysia";
import DockerClient from "@dockstat/docker-client";
import DockStatDB from "@dockstat/db";

const db = new DockStatDB();
const dockerClient = new DockerClient(db.getDB(), {
  enableMonitoring: true
});

const app = new Elysia()
  .get("/api/containers/:clientId", async ({ params }) => {
    return await dockerClient.getAllContainers(parseInt(params.clientId));
  })
  .post("/api/containers/:clientId/:containerId/start", async ({ params }) => {
    await dockerClient.startContainer(
      parseInt(params.clientId),
      params.containerId
    );
    return { success: true };
  })
  .get("/api/status", async () => {
    return await dockerClient.getStatus();
  });
```

### With WebSocket Streaming

```typescript
import { Elysia } from "elysia";
import { websocket } from "@elysiajs/websocket";
import { StreamManager, STREAM_CHANNELS } from "@dockstat/docker-client";

const streamManager = new StreamManager();

const app = new Elysia()
  .use(websocket())
  .ws("/ws/stats", {
    open(ws) {
      streamManager.subscribe(STREAM_CHANNELS.CONTAINER_STATS, (stats) => {
        ws.send(JSON.stringify(stats));
      });
    },
    close(ws) {
      // Cleanup handled automatically
    }
  });
```

## Related Packages

* `@dockstat/db` - Database layer for persistence
* `@dockstat/sqlite-wrapper` - SQLite operations
* `@dockstat/logger` - Logging utilities
* `@dockstat/typings` - Type definitions
* `@dockstat/plugin-handler` - Plugin system integration

## License

Part of the DockStat project. See main repository for license information.

## Contributing

Issues and PRs welcome at [github.com/Its4Nik/DockStat](https://github.com/Its4Nik/DockStat)