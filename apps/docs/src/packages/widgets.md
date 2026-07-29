# `widgets`

The `widgets` package powers DockStat's plugin-driven dashboards. It includes
the server-side data-pipe engine, the frontend widget runner, the importer
that turns external widget manifests into runnable components, and the
storage layer for dashboards, widget definitions, and runtime data.

## What lives in `packages/widgets`

```text
packages/widgets/
└── src/
    ├── client/             # Browser side: useWidgetData + registry
    ├── server/             # Bun/Elysia side
    │   ├── data-pipe/      # Engine, registry, transforms, websocket provider
    │   ├── import/         # dashboard-importer + widget-importer
    │   ├── repository/     # Dashboard + widget repositories
    │   ├── db/             # widgets-store, dashboards-store, schema
    │   ├── routes/         # REST routes (widgets, dashboards, data-pipes)
    │   ├── ws/             # WebSocket handler and types
    │   └── widgets-service.ts
```

## Concepts

A **dashboard** is an ordered grid of widgets backed by a **data pipe**: a
typed graph of nodes that pulls data from one or more sources, transforms it,
and emits payload envelopes to subscribers.

| Concept | Where it lives |
|---------|----------------|
| Dashboard layout | `server/repository/dashboard-repository.ts` |
| Widget definition | `server/repository/widget-repository.ts` |
| Data pipe schema | `server/types/data-pipe.ts` |
| Engine | `server/data-pipe/engine.ts` |
| Built-in transforms | `server/data-pipe/transforms-advanced.ts` |
| Built-in sources | `server/data-pipe/builtins.ts` |
| Widget registry (client) | `client/registry.tsx` |
| Widget runner (client) | `client/hooks/use-widget-data.ts` |

## Server API

`WidgetsService` is the singleton the API mounts. It exposes REST and
WebSocket routers plus the in-process data-pipe engine:

```typescript
import WidgetsService from "widgets/server"

new WidgetsService(db, logger, {
  requireAuth: true,
  verifyToken: wsTokenVerifier,
}).getRestRoutes()
```

The REST router covers:

| Route | Method | Purpose |
|-------|--------|---------|
| `/widgets/manifests` | GET | List registered widget manifests |
| `/widgets/manifests/:id` | GET | Read one manifest |
| `/widgets/manifests/:id/import` | POST | Import a widget from a manifest URL |
| `/dashboards` | GET / POST | List or create dashboards |
| `/dashboards/:id` | GET / PUT / DELETE | CRUD on a single dashboard |
| `/data-pipes/:dashboardId/evaluate` | POST | Manually re-run the data pipe |
| `/widgets/data-frame` | POST | Server-side widget rendering hook |

The WebSocket router publishes to `widgets/dashboard/<id>` whenever the engine
emits new payloads.

## Data pipes

A data pipe is a directed graph with three node kinds:

1. **Source** — pulls data from a provider (HTTP, Docker stats, blockchain
   RPC, custom service function, etc.). Built-ins are exposed in
   `data-pipe/builtins.ts` (`http`, `docker-stats`, `websocket-source`,
   `rest-poll`).
2. **Transform** — applies a function to the upstream payload
   (`pick`, `rename`, `map`, `reduce`, `aggregate`, `window`, anything you
   define in `data-pipe/registry.ts`).
3. **Sink** — emits results to widget subscribers
   (`widget-payload`, `broadcast`, `http-post`).

The engine evaluates a pipe by walking the topology from each registered
source. Transforms are pure; sinks are not. The engine retains published
payloads so late subscribers receive the last frame.

Example pipe (YAML form for the importer):

```yaml
id: containers-stats
nodes:
  - id: source.docker
    type: docker-stats
    options:
      intervalMs: 5000
  - id: transform.aggregate
    type: aggregate
    options:
      windowMs: 15000
  - id: sink.widget
    type: widget-payload
    options:
      widgetId: container-gauge
```

## Importing widgets and dashboards

The importer at `server/import/` reads a widget or dashboard manifest and
records it in the corresponding store. A widget manifest must include:

- A unique `id`.
- Type information for the props the widget consumes.
- One or more `loaders` (data sources) that resolve to data-pipe sources.
- A `component` reference that the client registry can resolve.

`dashboard-importer.ts` resolves cross-widget references and forwards the
result to `dashboard-repository.ts`.

## Client model

The client side is a thin registry + hook. The UI package
[`@dockstat/ui`](../../../../packages/ui) exposes widget shells; the runtime maps
incoming `widgets/dashboard/<id>` payloads into widget state through
`useWidgetData`.

```typescript
const gauge = useWidgetData<{ cpu: number; memory: number }>("gauge")
return gauge.loading ? <Skeleton /> : <Gauge value={gauge.data?.cpu ?? 0} />
```

When a new dashboard is opened, the API evaluates the pipe on first
subscriber so static providers do not have to wait for the periodic loop.

## Configuration

The `WidgetsService` constructor accepts:

| Option | Purpose |
|--------|---------|
| `requireAuth` | Enforce authentication on REST + WS |
| `verifyToken(token)` | Verify JWT / API-key before serving |
| `engineOptions.pipeLingerMs` | How long an evaluated pipe keeps payloads |

Bundle size is kept low because the engine and registry import directly from
`@dockstat/utils` and `@dockstat/sqlite-wrapper`.

## Next steps

- See [apps/api.md](../apps/api.md) for how the API mounts the widget
  service.
- See [apps/dockstat.md](../apps/dockstat.md) for the dashboard UI.
- See [packages/plugins.md](./plugins.md) for the authoring model when you
  ship your own widgets.
