# Architecture overview

DockStat is composed of a backend API, a server-side rendered dashboard, a fleet
of remote agents, a plugin registry, and a verification server, all glued
together by a small set of internal TypeScript packages.

This page explains how these pieces communicate, what data flows between them,
and which package owns which concern.

## High-level diagram

```text
┌──────────────────┐       Eden treaty        ┌──────────────────┐
│  dockstat (UI)   │ ───────────────────────▶ │       api        │
│ React Router SSR │ ◀────── WebSockets ───── │  Elysia + Bun    │
└──────────────────┘                         └────────┬─────────┘
                                                     │
                                        ┌────────────┼────────────┐
                                        ▼            ▼            ▼
                                ┌───────────┐ ┌───────────┐ ┌───────────┐
                                │  SQLite   │ │ @dockstat │ │ @dockstat │
                                │ (sqlite-  │ │ /plugin-  │ │ /theme-   │
                                │  wrapper) │ │  handler  │ │  handler  │
                                └───────────┘ └─────┬─────┘ └───────────┘
                                                   │
                                                   ▼
                                        Dynamic plugin instances
                                        (per-plugin Elysia routes)
                                                   ▲
                                                   │
                        ┌──────────────────────────┴────────────────────┐
                        │                                                │
                  ┌─────┴─────┐                                  ┌───────┴───────┐
                  │  docknode │   Swarm stacks / docker-compose  │   dockstore   │
                  │  agent    │ ────────────────────────────────▶ │ (verification │
                  │  (Elysia) │                                  │ + registry)   │
                  └───────────┘                                  └───────────────┘
```

## Runtime architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| Browser | React Router v7 (SSR), TanStack Query, TailwindCSS, Framer Motion | Dashboard UI, plugin-rendered pages, real-time widgets |
| Transport | Eden Treaty (typed REST), WebSockets with dynamic topics | Strongly typed API and pub/sub updates |
| API | Elysia on Bun (prefix `/api/v2`), Typebox schemas, OpenAPI at `/docs` | Routing, validation, plugin hosting, metrics |
| Persistence | SQLite via [`@dockstat/sqlite-wrapper`](packages/sqlite-wrapper.md) with auto-migration and backups | Hosts, plugins, themes, users, sessions, dashboards |
| Plugins | [`@dockstat/plugin-handler`](packages/plugins.md) + [`@dockstat/plugin-builder`](packages/plugins.md) | DB-stored code loaded at runtime, mounted onto the API |
| Remote agents | `@dockstat/docknode` instances connected over HTTPS | Translate compose YAML into DockStacks on real Docker hosts |
| Registry | `apps/dockstore-verification` | Manual security review and version hashing |

## Data flow walkthrough

The following sequence describes what happens when a user opens the dashboard
and looks at a remote host's containers.

1. The browser requests `apps/dockstat` (SSR). It receives a streamed HTML
   response and a JSON payload generated from React Router loaders.
2. The frontend hydrates and calls typed hooks under `apps/dockstat/src/hooks`.
   Queries read from the Eden Treaty client in
   [`packages/utils/src/react/eden`](../../../packages/utils/src/react/eden).
3. The API route looks up the requesting user through
   [`@dockstat/auth`](packages/auth.md) middleware, then delegates to
   `@dockstat/docker-client` to fetch hosts and containers.
4. The Docker Client Manager spawns a worker per logical client. The worker
   owns a Dockerode connection per host. State flows up as live events.
5. WebSocket updates are published via the shared handler in
   `apps/api/src/websockets`, then republished to subscribed clients on topics
   such as `containers/metrics` or `widgets/dashboard/<id>`.
6. Plugins in the database can intercept lifecycle events, register routes,
   and contribute frontend templates that get merged into the dashboard router.

## Frontend ↔ backend contracts

DockStat uses a typed client generated from the API at build time. The
canonical source is `apps/api/src/index.ts`, exported as `TreatyType`. Three
pieces wire the dashboard to the backend:

1. `apps/dockstat/src/lib/api.ts` builds the typed `treaty` instance from
   `TreatyType` and exposes `api`. The treaty holds route references — it
   does not perform requests itself. The base URL is read from
   `import.meta.env.DOCKSTAT_API_PORT` and falls back to
   `http://localhost:3030` in development.
2. `apps/dockstat/src/providers/edenClient.tsx` instantiates a single
   `eden.Client` bound to the app toaster and passes it to `eden.EdenProvider`.
   The client injects the bearer token, handles 401s, and runs every actual
   request.
3. Hooks under `apps/dockstat/src/hooks/` access the client with
   `useEdenClient()` and call `eden.query(...)`, `eden.mutate(...)`, or
   `eden.mutateRoute(...)` against the typed `api` routes.

```tsx
// apps/dockstat/src/providers/edenClient.tsx
import { eden } from "@dockstat/utils/react"
import { toast } from "@/lib/toast"

const client = new eden.Client(toast)

export function EdenClientProvider({ children }: { children: React.ReactNode }) {
  return <eden.EdenProvider client={client}>{children}</eden.EdenProvider>
}
```

Because the API is the source of truth, adding a route in `apps/api/src/routes`
and registering it in `apps/api/src/index.ts` immediately surfaces a typed
route reference on `api`. Hooks then opt into it without further typing.

## Beyond the React tree

The `eden.Client` exposes additional helpers for non-React or imperative
call sites:

- `client.prepareQuery(config)` returns a custom hook that, when called inside
  a component, re-evaluates `useEdenQuery` with the given config and the
  latest bearer token.
- `client.prepareMutateRoute(config)` does the same for
  `useEdenRouteMutation`.
- `await client.call(route, { body, fetchOptions, skipAuthHandler })` fires
  a one-off request from any context (event handlers, `useCallback` bodies)
  while still injecting the bearer token and triggering the optional
  `onUnauthorized` handler on a `401`. Unlike `mutateAsync`, `call` does not
  throw; it returns a `Promise<{ data, error, status }>` so imperative callers
  can branch on `status` directly.

These methods exist so a small piece of imperative logic does not have to
open a new hook layer every time it needs to talk to the API.

## Plugin boundaries

A plugin lives in a SQLite row in the `plugins` table. When activated:

- The handler in [`@dockstat/plugin-handler`](packages/plugins.md)
  writes the plugin source to a temp file, dynamically imports it, and exposes
  its `apiRoutes` and `events` on the running API.
- If the plugin declares a `frontend` config, the dashboard fetches its
  templates through `/plugins/routes` and renders them inside the React Router
  tree.
- The plugin gets a private logger and sub-table under its declared name, so
  the plugin only ever touches its own data.

This model keeps plugins isolated without resorting to sandboxing — every
plugin still runs as plain TypeScript inside the API worker.

## Remote agent loop

`@dockstat/docknode` is a tiny Elysia service that runs alongside a real
Docker daemon. The API pushes `DockStacks` definitions (compose-derived) to it
over an authenticated HTTPS tunnel. The agent translates the stack into
services, secrets, configs, and networks using
[`@dockstat/docker-swarm`](packages/docker.md), then streams service
logs back over its WebSocket endpoint.

The agent never speaks directly to the browser — it only talks to the API. The
API aggregates agent state and forwards it to connected dashboards.

## Next steps

- See [api.md](./apps/api.md) for full backend route details and OpenAPI usage.
- See [docknode.md](./apps/docknode.md) for the remote-agent protocol and
  compose translation.
- See [plugins.md](./packages/plugins.md) for the plugin lifecycle and
  authoring guide.
