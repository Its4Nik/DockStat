# DockNode

`@dockstat/docknode` is a remote agent that runs next to a real Docker host
and translates DockStacks definitions into Swarm primitives (services, tasks,
configs, secrets, networks). The API talks to it over a typed treaty; the
agent is stateless apart from a local SQLite cache.

## What lives in `apps/docknode`

```
src/
├── auth/                  # PSK + dev-auth helpers
├── stacks/                # Compose → stack translation
│   ├── routes.ts          # Elysia routes (POST /stacks, etc.)
│   ├── swarm.ts           # Swarm client wrapper
│   ├── types.ts           # DockStack typebox schemas
│   └── utils.ts           # YAML → env conversion
├── docker-client.ts       # Bundled @dockstat/docker-client instance
├── db.ts                  # Local SQLite cache
├── index.ts               # Elysia boot
└── _treaty.ts             # Typed treaty export
```

DockNode ships **only the `_treaty.ts` treaty export** to consumers — there is
no library API beyond what the API consumes. Treat it as a deployable binary,
not a reusable package.

## Boot

```bash
# from repo root
bun install
bun run dev --filter=@dockstat/docknode
```

The agent listens on port `4040` by default. Override it with `PORT`.

```typescript
// apps/docknode/src/index.ts (excerpt)
const DockNode = new Elysia({ prefix: "/api", name: "DAPI" })
  .use(openapi({ path: "/docs", provider: "scalar" }))
  .use(DockStacksRoutes)
  .use(SwarmRoutes)
  .get("/status", ({ status }) => status(200, "OK"))
  .ws("/logs/stream", { /* … */ })
  .listen(4040)
```

## DockStacks

A DockStack is a persistence-friendly form of `docker-compose.yaml` that the
API can store, version, and ship to a remote agent. The agent converts the
stack into Swarm primitives using `@dockstat/docker-swarm`.

### Example request

```http
POST /api/stacks
Content-Type: application/json
```

```json
{
  "name": "Test",
  "yaml": "services:\n  example:\n    image: example:latest\n    environment:\n      - ENV_VAR_1\n      - ENV_VAR_2=false",
  "repository": "its4nik/dockstat:dev/apps/dockstore",
  "repoName": "Example App",
  "version": "1.0.0",
  "env": {
    "ENV_VAR_1": "12345",
    "ENV_VAR_2": true
  }
}
```

### What the agent writes

```yaml
# ./stacks/<id>/docker-compose.yaml
services:
  example:
    image: example:latest
    environment:
      - ENV_VAR_1
      - ENV_VAR_2
```

```dotenv
# ./stacks/<id>/.env
ENV_VAR_1=12345
ENV_VAR_2=true
```

The agent stores the stack under `./stacks/<id>/` and uses the in-tree
`@dockstat/docker-swarm` client to bring it online.

## Authentication

The agent supports two modes, both PSK-based:

| Variable | Purpose |
|----------|---------|
| `DOCKNODE_DOCKSTACK_AUTH_PSK` | Production pre-shared key |
| `DOCKNODE_DOCKSTACK_DEV_AUTH` | Development-only key |
| `DOCKNODE_DOCKSTACK_AUTH_PRIORITY` | `"psk"` to require PSK, `"dev"` to allow the dev key |

We recommend running the agent with the dev key disabled once stacks are
exposed to multiple consumers.

## Streaming logs

`ws://<host>:4040/api/logs/stream` accepts a small envelope:

```typescript
{
  serviceId: string
  follow?: boolean        // default false
  tail?: number           // default 100
  since?: number          // Unix timestamp
  timestamps?: boolean    // default true
}
```

The agent subscribes to the Docker service log stream and forwards every
entry as a typed payload:

```typescript
{
  level: "info" | "warn" | "error" | "debug"
  message: string
  serviceId?: string
  serviceName?: string
  nodeId?: string
  nodeName?: string
  timestamp: string // ISO-8601
}
```

The dashboard subscribes to log entries through the WebSocket effects in
`apps/dockstat/src/lib/websocketEffects`. The API bridges those topics to
the agent's underlying stream at
`ws://<agent-host>:<PORT>/api/logs/stream` (see [apps/api.md](./api.md) for
the route proxy).

## Docker integration

The agent uses [`@dockstat/docker-client`](../packages/docker.md) under the hood.
The `apps/docknode/src/docker-client.ts` wrapper configures a default client
during boot so all stack operations route through the worker system.

## Next steps

- See [apps/api.md](./api.md) for how the API talks to DockNode.
- See [packages/docker.md](../packages/docker.md) for the worker-isolated host
  manager behind the agent.
- See [resources/deployment.md](../resources/deployment.md) for production
  port, PSK, and networking guidance.
