# @dockstat/docker-client — Docker Client Manager

High-level manager for orchestrating multiple Docker hosts via isolated workers. It provides a simple, typed API to:

- Register logical “clients” (each with its own worker and host table)
- Add/update/remove Docker hosts per client
- Query containers, images, networks, volumes, and system info
- Control containers (start/stop/restart/kill/exec/logs)
- Turn on monitoring (host metrics, container metrics, container events, health checks)
- Aggregate monitoring data per client

This README focuses on the Docker-Client-Manager usage only.

---

## Installation

This package targets the Bun + ESM toolchain used in DockStat.

```bash
bun install
```

Type-check during development:

```bash
bun run check-types
```

---

## Quick start

```ts
import Logger from "@dockstat/logger"
import DB from "@dockstat/sqlite-wrapper"
import PluginHandler from "@dockstat/plugin-handler"
import DCM from "@dockstat/docker-client" // default export is the Docker Client Manager

// 1) Infrastructure
const logger = new Logger("App")
const db = new DB("dockstat.db")
const pluginHandler = new PluginHandler()

// 2) Create the manager (optionally set maxWorkers)
const dcm = new DCM(db, pluginHandler, logger, { maxWorkers: 4 })

// 3) Register a client (one worker per client)
//    - enableMonitoring true auto-creates MonitoringManager inside the worker
const { success, clientId } = await dcm.registerClient("default", {
  enableMonitoring: true,
  monitoringOptions: {
    enableHostMetrics: true,
    enableContainerMetrics: true,
    enableContainerEvents: true,
    enableHealthChecks: true,
    hostMetricsInterval: 15000,
  },
})

if (!success || !clientId) {
  throw new Error("Failed to register client")
}

// 4) Add a Docker host for that client
//    Host can be a local or remote daemon reachable by HTTP(S)
const host = await dcm.addHost(
  clientId,
  "127.0.0.1", // hostname / IP / DNS
  "local-docker", // display name
  false, // secure (https) ?
  2375 // port
)

// 5) (Optional) Initialize worker with explicit hosts. If omitted, worker loads hosts from DB.
await dcm.init(clientId)

// 6) Query and control
const containers = await dcm.getAllContainers(clientId)
logger.info(`containers: ${containers.length}`)

// 7) Monitoring
// If you registered the client with enableMonitoring: true, you can directly start monitoring:
await dcm.startMonitoring(clientId)

// Or, if enableMonitoring was false, create the manager first, then start:
// await dcm.createMonitoringManager(clientId)
// await dcm.startMonitoring(clientId)
```

---

## Architecture in one picture

- Your code calls the Docker Client Manager (DCM) API.
- DCM sends typed requests to a per-client worker.
- The worker hosts a DockerClient instance (mixins for hosts/containers/images/…)
- DockerClient uses Dockerode to talk to each configured Docker host.
- Monitoring runs inside the worker and pushes events via a proxy up to the manager, which hands them to your PluginHandler hooks.

This flow isolates Docker I/O per client and keeps the main thread responsive.

---

## Manager API overview

The manager composes several areas: Core, Hosts, Containers, Images, Networks, Volumes, System, and Monitoring. All methods are Promise-based and throw on failure.

### Core

- registerClient(name: string, options?: DOCKER.DockerAdapterOptions)
  - Returns { success: boolean; message: string; clientId?: number }
- updateClient(id: number, name: string, options: DOCKER.DockerAdapterOptions)
  - Returns { success: boolean; message: string; clientId?: number }

Utility (selected):
- getClient(clientId: number)
  - Returns the internal wrapper (for diagnostics)
- getAllClients()
  - Returns all known clients ({ id, name, … })

Note: The internal worker is created automatically when you register a client.

### Hosts

- init(clientId: number, hosts?: DATABASE.DB_target_host[]): Promise<void>
  - Initialize worker with optional explicit hosts (otherwise it loads from DB).
- addHost(clientId: number, hostname: string, name: string, secure: boolean, port: number, id?: number): Promise<DATABASE.DB_target_host>
- updateHost(clientId: number, host: DATABASE.DB_target_host): Promise<void>
- removeHost(clientId: number, hostId: number): Promise<void>
- getHosts(clientId: number): Promise<DATABASE.DB_target_host[]>
- getAllHosts(): Promise<Array<{ name: string; id: number; clientId: number; reachable: boolean }>>
- ping(clientId: number): Promise<{ reachableInstances: number[]; unreachableInstances: number[] }>

Example:

```ts
const hosts = await dcm.getHosts(clientId)
const ping = await dcm.ping(clientId)
```

### Containers

Queries:
- getAllContainers(clientId: number): Promise<DOCKER.ContainerInfo[]>
- getContainer(clientId: number, hostId: number, containerId: string): Promise<DOCKER.ContainerInfo>
- getAllContainerStats(clientId: number): Promise<DOCKER.ContainerStatsInfo[]>
- getContainerStatsForHost(clientId: number, hostId: number): Promise<DOCKER.ContainerStatsInfo[]>
- getContainerStats(clientId: number, hostId: number, containerId: string): Promise<DOCKER.ContainerStatsInfo>
- getContainerCount(): Promise<{ total: number; perHost: Array<{ hostId: number; clientId: number; containerCount: number }> }>

Control:
- startContainer(clientId, hostId, containerId)
- stopContainer(clientId, hostId, containerId)
- restartContainer(clientId, hostId, containerId)
- removeContainer(clientId, hostId, containerId, force?)
- pauseContainer(clientId, hostId, containerId)
- unpauseContainer(clientId, hostId, containerId)
- killContainer(clientId, hostId, containerId, signal?)
- renameContainer(clientId, hostId, containerId, newName)

Logs & Exec:
- getContainerLogs(clientId, hostId, containerId, options?): Promise<string>
- execInContainer(clientId, hostId, containerId, command: string[], options?): Promise<{ stdout: string; stderr: string; exitCode: number }>

Example:

```ts
const stats = await dcm.getContainerStats(clientId, hostId, "abcd1234")
await dcm.restartContainer(clientId, hostId, "abcd1234")
const { stdout, exitCode } = await dcm.execInContainer(clientId, hostId, "abcd1234", ["ls", "-la"])
```

### Images

- getImages(clientId: number, hostId: number): Promise<Dockerode.ImageInfo[]>
- pullImage(clientId: number, hostId: number, imageName: string): Promise<void>

### Networks

- getNetworks(clientId: number, hostId: number): Promise<Dockerode.NetworkInspectInfo[]>

### Volumes

- getVolumes(clientId: number, hostId: number): Promise<Dockerode.VolumeInspectInfo[]>

### System

- getSystemInfo(clientId: number, hostId: number)
- getSystemVersion(clientId: number, hostId: number)
- getDiskUsage(clientId: number, hostId: number)
- pruneSystem(clientId: number, hostId: number)

---

## Monitoring

Monitoring lives inside the worker. You can enable it up-front via `registerClient(..., { enableMonitoring: true })` or create the manager later and then start.

Lifecycle:
- createMonitoringManager(clientId: number): Promise<void>  // only needed if you didn’t enableMonitoring
- startMonitoring(clientId: number): Promise<void>
- stopMonitoring(clientId: number): Promise<void>
- isMonitoring(clientId: number): Promise<boolean>
- hasMonitoringManager(clientId: number): Promise<boolean>

Data:
- getAllHostMetrics(clientId: number): Promise<DOCKER.HostMetrics[]>
- getHostMetrics(clientId: number, hostId: number): Promise<DOCKER.HostMetrics>
- getAllStats(clientId: number): Promise<DOCKER.AllStatsResponse>
- checkHostHealth(clientId: number, hostId: number): Promise<boolean>
- checkAllHostsHealth(clientId: number): Promise<Record<number, boolean>>

Example:

```ts
// Start monitoring for a client
if (!(await dcm.hasMonitoringManager(clientId))) {
  await dcm.createMonitoringManager(clientId)
}
await dcm.startMonitoring(clientId)

// Query data
const hostMetrics = await dcm.getAllHostMetrics(clientId)
const healthyMap = await dcm.checkAllHostsHealth(clientId)
```

Events:
- The worker proxies events (e.g., `container:started`, `container:stopped`, `container:created`, `container:destroyed`, `container:removed`, `container:metrics`, `host:metrics`, `host:health:changed`, `error`) to the manager, which forwards them to your PluginHandler hooks.
- Provide hook implementations through your plugin system to react to these events (e.g., persist metrics, notify, etc.).

---

## Options reference (selected)

When registering a client:

```ts
const opts: DOCKER.DockerAdapterOptions = {
  defaultTimeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableMonitoring: true,
  enableEventEmitter: true,

  monitoringOptions: {
    containerEventPollingInterval: 30000,
    enableContainerMetrics: true,
    containerMetricsInterval: 60000,
    enableContainerEvents: true,
    enableHealthChecks: true,
    enableHostMetrics: true,
    healthCheckInterval: 60000,
    hostMetricsInterval: 60000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  execOptions: {
    // default exec settings (optional)
  },
}
```

Notes:
- Intervals below certain thresholds are automatically lifted to safe minimums.
- Monitoring can be started even if `enableMonitoring` was false, by calling `createMonitoringManager` and then `startMonitoring`.

---

## Usage patterns and best practices

- Register one client per logical cluster/tenant you want to isolate. Each client has its own worker and host table.
- Add multiple Docker hosts to a single client to manage them as a group.
- Use `getContainerCount()` to build dashboards quickly.
- Wrap calls in `try/catch` to handle network/Docker daemon errors gracefully.
- For long-running apps, periodically call `ping(clientId)` to detect unhealthy hosts and inform users.

---

## Troubleshooting

- Worker not initializing:
  - Ensure the DB path is valid and writable.
  - Check your logging for an init timeout; re-register or update the client to rebuild the worker.

- Cannot reach Docker host:
  - Verify TCP connectivity and `DOCKER_HOST` settings server-side.
  - If using TLS, set `secure: true` and configure daemon accordingly.

- Monitoring not producing data:
  - Confirm `enableMonitoring` or call `createMonitoringManager` before `startMonitoring`.
  - Ensure at least one host is reachable.

---

## License

See Monorepo root
