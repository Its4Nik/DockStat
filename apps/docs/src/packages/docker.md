# Docker packages

DockStat ships three layered Docker libraries. Each package handles a
distinct scope; together they cover everything from a single Dockerode
wrapper up to multi-tenant stack administration over Swarm.

| Package | Scope |
|---------|-------|
| [`@dockstat/docker`](../../../../packages/bun-docker) | Single-host Docker REST wrapper tuned for Bun |
| [`@dockstat/docker-client`](../../../../packages/docker-client) | Worker-isolated multi-host manager with monitoring |
| [`@dockstat/docker-swarm`](../../../../packages/docker-swarm) | Swarm primitives (services, stacks, configs, secrets, tasks) |

## `@dockstat/docker` (package folder `bun-docker`)

The lowest-level package. It exposes a Bun-native wrapper around Dockerode
that deals with the engine's quirks (chunked JSON, large log buffers, exec
streams) so callers don't have to.

Use it directly when you want to talk to one Docker daemon and don't need
isolation, monitoring, or worker offloading. The package re-exports Dockerode
types and adds:

- Uniform request options (timeouts, retries, logging hooks) defined in
  `utils/request-options.ts`.
- Typed response transformers in `utils/response.ts`.
- A WebSocket helper for the Docker events stream.
- A small logger that delegates to `@dockstat/logger` when available.

This package is the right choice for short-lived scripts or CLI commands
that only touch a single daemon. Everything else builds on `@dockstat/docker-client`.

## `@dockstat/docker-client`

This is the manager the API uses to talk to multiple Docker hosts. The key
feature is **per-client worker isolation**: each registered "client" gets its
own worker thread, its own Dockerode connections, and its own monitoring
loop. The manager sends typed messages to the worker and proxies events
back up.

### Quick start

```typescript
import Logger from "@dockstat/logger"
import DB from "@dockstat/sqlite-wrapper"
import PluginHandler from "@dockstat/plugin-handler"
import DCM from "@dockstat/docker-client"

const dcm = new DCM(db, pluginHandler, new Logger("App"), { maxWorkers: 4 })

const { success, clientId } = await dcm.registerClient("default", {
  enableMonitoring: true,
  monitoringOptions: {
    enableHostMetrics: true,
    enableContainerMetrics: true,
    enableContainerEvents: true,
    enableHealthChecks: true,
    hostMetricsInterval: 15_000,
  },
})

await dcm.addHost(clientId, "127.0.0.1", "local-docker", false, 2375)
await dcm.init(clientId)

const containers = await dcm.getAllContainers(clientId)
await dcm.startMonitoring(clientId)
```

### What the worker exposes

The worker splits responsibility into mixins:

| Mixin | Responsibilities |
|-------|------------------|
| `core` | Connection lifecycle, base config |
| `hosts` | Add, update, remove, list, ping |
| `containers` | List, stats, start, stop, restart, exec, logs |
| `images` | List and pull |
| `networks` | List and inspect |
| `volumes` | List and inspect |
| `system` | Info, version, disk usage, prune |
| `monitoring` | Host metrics, container metrics, container events, health checks |

The main thread interacts with each mixin through the manager's typed API.
For example, `dcm.getAllContainers(clientId)` ends up calling
`containers.all()` inside the worker.

### Monitoring

Monitoring runs entirely inside the worker. The events move up through a
proxy that emits them as typed events:

| Worker event | Description |
|--------------|-------------|
| `container:started` | A container transitioned to running |
| `container:stopped` | A container transitioned to stopped/exited |
| `container:created` | A new container appeared on a host |
| `container:destroyed` | A container was removed |
| `container:removed` | Mirror of destroyed with extra metadata |
| `container:metrics` | Periodic CPU / memory / network stats |
| `host:metrics` | Periodic host-level CPU / disk / memory |
| `host:health:changed` | Health check result flipped |
| `error` | Worker-observed failure |

The manager fans those events to the `PluginHandler`, so plugins can persist
metrics, send notifications, or push into custom dashboards.

### Best practices

- Register one client per logical cluster or tenant to keep worker isolation
  meaningful.
- Use `dcm.ping(clientId)` periodically to mark unreachable hosts.
- For long-running deployments, wire `dcm.checkAllHostsHealth(clientId)` into
  a status endpoint so the dashboard reflects daemon health.
- Treat `enableMonitoring: true` as the default; retroactively enabling
  monitoring on a hot worker requires `createMonitoringManager` first.

## `@dockstat/docker-swarm`

This package covers Swarm-specific operations: stacks, services, configs,
secrets, networks, and tasks. `@dockstat/docknode` uses it to translate a
DockStack definition into a running Swarm deployment.

### Capabilities

| Area | Includes |
|------|----------|
| Stack | Compose-spec decoder, translator, deployer |
| Service | Create / scale / update / remove |
| Task | Inspect, list, wait |
| Config | Create / update / delete |
| Secret | Create / update / delete |
| Network | Create / remove / inspect |
| Node | List nodes |

The `client` is a thin layer over Dockerode's Swarm endpoints. The `modules`
folder exposes typed helpers per area, each with `index.ts` and `types.ts`
so plugin authors can import only what they need.

### Translating a compose file

The translator lives in `modules/stacks/parser.ts` and `modules/stacks/types.ts`.
It accepts the official Docker compose-spec JSON, normalizes environment
variables, and produces a `Stack` record that the deployer turns into Swarm
service definitions.

```typescript
import { parseCompose } from "@dockstat/docker-swarm/stacks/parser"

const stack = parseCompose(composeSpecJson)
await deployer.deploy(stack, { auth: preSharedKey })
```

## Choosing the right package

| Need | Use |
|------|-----|
| One-shot CLI script that talks to a single daemon | `@dockstat/bun-docker` |
| Production multi-host dashboard with monitoring | `@dockstat/docker-client` |
| Compose-style stack deployment on a remote Swarm | `@dockstat/docker-swarm` |
| Talk to the API, then let the API manage Docker | `@dockstat/api` |

## Next steps

- See [apps/api.md](../apps/api.md) for the routes that surface the Docker
  manager to the frontend.
- See [apps/docknode.md](../apps/docknode.md) for how DockNode uses
  `@dockstat/docker-swarm` to deploy stacks.
