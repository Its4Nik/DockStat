# The DockStat API

The `@dockstat/api` app is the type-safe backend that powers every DockStat
dashboard. It runs on Bun + Elysia, exposes REST + WebSocket routes under the
`/api/v2` prefix, validates every request with Typebox, and produces OpenAPI
docs at `/api/v2/docs`.

## What lives in `apps/api`

```
src/
├── auth.ts                # Wires @dockstat/auth into Elysia
├── elysia-plugins.ts      # cors, openapi, server-timing
├── widget.ts              # Mounts @widgets/server + WebSocket fan-out
├── database/              # DockStatDB helper + utils
├── docker/                # DockNode routes + adapter
├── handlers/              # Request logger + onError
├── middleware/            # Metrics, rate limiting
├── models/                # Typebox schema definitions
├── plugins/               # Frontend plugin loader helpers
├── routes/                # Per-domain route modules
├── services/              # Certificate service and helpers
├── websockets/            # Shared WS handler + dynamic topics
└── index.ts               # Elysia app + Treaty export
```

## Application bootstrap

`apps/api/src/index.ts` is the single source of truth. It composes the Elysia
app, mounts WebSocket handlers outside the auth guard (because Elysia's
HTTP-level guards do not run on WS upgrades), and exposes the typed `Treaty`
shape used by the frontend.

```typescript
// apps/api/src/index.ts (excerpt)
export const DockStatAPI = new Elysia({
  precompile: false,
  prefix: "/api/v2",
  name: "DockStat-API",
})
  .use(errorHandler)
  .use(Middleware)              // auth middleware (JWT + API key)
  .use(DockStatElysiaPlugins)   // cors, openapi, server-timing
  .use(CreateRequestLogger())
  .use(DSWebSockerHandler.getRoutes())
  .use(WidgetsService.getWsRoutes())
  .guard(authenticated(() => stateMap), (app) =>
    app
      .use(MetricsMiddleware)
      .use(StatusRoutes)
      .use(DBRoutes)
      .use(CertificateRoutes)
      .use(DockerRoutes)
      .use(PluginRoutes)
      // ...
  )
  .use(AuthHandler.getRoutes())
  .listen(PORT)

export type TreatyType = typeof DockStatAPI
```

> [!IMPORTANT]
> The default port is `3030`. Set `DOCKSTATAPI_PORT` to override it.

## Routing structure

| Prefix | Module | Purpose |
|--------|--------|---------|
| `/auth` | `@dockstat/auth` | OIDC flows, local users, API keys, sessions |
| `/docker` | `routes/docker/*` | Hosts, clients, containers, manager |
| `/db` | `routes/db/*` | Config + repository management |
| `/metrics` | `routes/metrics/*` | Prometheus scrape endpoint |
| `/plugins` | `routes/plugins/*` | Plugin lifecycle and route proxy |
| `/status` | `routes/status.ts` | Lightweight health + readiness |
| `/certificates` | `routes/certificates/*` | TLS self-signed bootstrap |
| `/themes` | `routes/themes.ts` | Theme CRUD via `@dockstat/theme-handler` |
| `/widgets` | `routes/widgets/*` | Dashboard + data-pipe REST |
| `/ws` | `websockets/*` | Shared pub/sub bus |
| `/misc` | `routes/misc/*` | Auxiliary utilities |

## OpenAPI and Swagger UI

The API mounts `@elysiajs/openapi` at `/api/v2/docs` using the Scalar provider.
Every route under the auth guard ships a Typebox schema that OpenAPI uses for
request and response examples. For machine-readable output, hit the standard
`/openapi.json` endpoint.

The API also publishes bearer and API-key security schemes in its spec:

```json
{
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      },
      "apikey": {
        "type": "apiKey",
        "in": "Api-Key",
        "name": "Api-Key"
      }
    }
  }
}
```

To test routes, open `http://localhost:3030/api/v2/docs` after starting the
API. Scalar lets you attach a bearer token with the **Authorize** button.

## Authentication

All non-public routes are protected by the `authenticated()` decorator
returned by `@dockstat/auth`. The middleware accepts three credential sources,
in this order:

1. `Authorization: Bearer <jwt>` header.
2. `Api-Key: <key>` or `X-API-Key: <key>` header.
3. `auth_token` cookie.

For WebSockets, browsers cannot set custom headers on upgrades, so the shared
WS router accepts the JWT in a `?token=` query parameter. Queries without a
valid token are rejected at open time.

Sessions are tracked server-side. Logging out invalidates the JWT's `jti` in
the `auth-sessions` table, which means the same `auth_token` cannot be reused
even if it is still cryptographically valid.

## Common patterns

### Adding a new authenticated route

1. Define a Typebox schema in `apps/api/src/models/<domain>.ts`.
2. Create `apps/api/src/routes/<domain>/index.ts` and export a sub-app:

   ```typescript
   import { Elysia, t } from "elysia"
   import { AuthHandler, authenticated } from "../../auth"

   export const WidgetRoutes = new Elysia({ prefix: "/widgets-meta" })
     .get("/list", () => [], {
       ...authenticated(),
       response: t.Array(t.Object({ id: t.String(), name: t.String() })),
     })
   ```

3. Mount the sub-app inside the auth guard on `DockStatAPI` in
   `apps/api/src/index.ts`.

### Streaming events via WebSocket

The shared handler at `/api/v2/ws` supports dynamic topic subscription. Any
plugin or internal component can call:

```typescript
import { DSWebSockerHandler } from "@/websockets"

DSWebSockerHandler.subscribe(topic, (payload, clientId) => {
  // ship to a specific client
})

DSWebSockerHandler.send("containers/metrics", { hostId: 1, cpu: 0.42 })
```

The frontend `WebSocketProvider` mirrors this API. After an event reaches the
manager, the engine evaluates any data-pipe subscriptions through [`@widgets/server`](../packages/widgets.md), then fans payloads out to widget
listeners.

## Metrics and observability

- **Server timing** is on by default. Disable with `DOCKSTATAPI_SHOW_TRACES=false`.
- **Prometheus** metrics are exposed at `/api/v2/metrics/` (see
  `routes/metrics/*`). Counters include HTTP request totals and durations;
  gauges cover database size, table row counts, and memory usage.
- **Structured logging** uses [`@dockstat/logger`](../../../../packages/logger).
  Every route produces a request log with timing and a UUID. Filter noisy
  logs with `DOCKSTAT_LOGGER_DISABLED_LOGGERS`.

## Errors

`handlers/onError.ts` returns structured envelopes for both validation and
runtime errors:

```json
{
  "error": "Validation failed",
  "path": "/api/v2/docker/hosts/add",
  "timestamp": "2026-01-15T12:34:56.000Z"
}
```

Clients can branch on the `error` field. Use 4xx errors for user-actionable
issues (validation, missing entity, unauthorized) and reserve 5xx for genuine
backend failures.

## Next steps

- Read [packages/auth.md](../packages/auth.md) for the auth primitives the
  middleware exposes.
- Read [packages/docker.md](../packages/docker.md) to learn how the Docker
  routes are generated.
- Read [resources/deployment.md](../resources/deployment.md) for the
  environment variables that change runtime behavior.
