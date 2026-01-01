---
id: b174143d-f906-4f8d-8cb5-9fc96512e575
title: API Reference
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 7dddd764-6483-4f84-96a3-988304e772d3
updatedAt: 2026-01-01T14:25:47.899Z
urlId: gVYlljv3Fs
---

> The DockStatAPI is implemented with Elysia and exposed under the prefix `/api/v2`. The canonical route definitions are in `apps/api/src/routes/` with schemas in `apps/api/src/models/`.

## Base URL

Development: `http://localhost:9876/api/v2`

## Route Overview

```mermaidjs
graph LR
    subgraph /api/v2
        direction TB
        DOCKER["/docker"]
        METRICS["/metrics"]
        PLUGINS["/plugins"]
        DB["/db"]
    end

    subgraph Docker Routes
        DOCKER --> STATUS[GET /status]
        DOCKER --> HOSTS["/hosts"]
        DOCKER --> CLIENT["/client"]
        DOCKER --> CONTAINERS["/containers"]
        DOCKER --> MANAGER["/manager"]
    end

    subgraph Host Routes
        HOSTS --> H_LIST[GET /]
        HOSTS --> H_GET[GET /:clientId]
        HOSTS --> H_ADD[POST /add]
        HOSTS --> H_UPDATE[POST /update]
    end

    subgraph Client Routes
        CLIENT --> C_REG[POST /register]
        CLIENT --> C_DEL[DELETE /delete]
        CLIENT --> C_ALL[GET /all/:stored]
        CLIENT --> C_MON_START[POST /monitoring/:clientId/start]
        CLIENT --> C_MON_STOP[POST /monitoring/:clientId/stop]
    end
```

## Docker Routes `/api/v2/docker`

### GET `/docker/status`

Returns the overall DockerClientManager status, including worker pool metrics.

**Response 200:**

```json
{
  "hosts": [{ "name": "string", "id": 1, "clientId": 1 }],
  "totalWorkers": 4,
  "activeWorkers": 2,
  "totalHosts": 3,
  "totalClients": 2,
  "averageHostsPerWorker": 1,
  "workers": [
    {
      "workerId": 1,
      "clientId": 1,
      "clientName": "local",
      "hostsManaged": 2,
      "activeStreams": 0,
      "isMonitoring": true,
      "initialized": true,
      "memoryUsage": { "rss": 0, "heapTotal": 0, "heapUsed": 0, "external": 0 },
      "uptime": 3600
    }
  ]
}
```

### Hosts `/docker/hosts`

| Method | Path | Description |
|----|----|----|
| GET | `/hosts/` | List all hosts |
| GET | `/hosts/:clientId` | Get metrics for a specific client |
| POST | `/hosts/add` | Add a new host |
| POST | `/hosts/update` | Update an existing host |

**POST** `**/hosts/add**` **body:**

```json
{
  "clientId": 1,
  "hostname": "docker.local",
  "name": "Local Docker",
  "secure": false,
  "port": 2375
}
```

**POST** `**/hosts/update**` **body:**

```json
{
  "clientId": 1,
  "host": {
    "id": 1,
    "host": "docker.local",
    "name": "Updated Name",
    "secure": true,
    "port": 2376
  }
}
```

### Client `/docker/client`

| Method | Path | Description |
|----|----|----|
| POST | `/client/register` | Register a new Docker client |
| DELETE | `/client/delete` | Remove a client |
| GET | `/client/all/:stored` | List all clients |
| POST | `/client/monitoring/:id/start` | Start monitoring for a client |
| POST | `/client/monitoring/:id/stop` | Stop monitoring for a client |

**POST** `**/client/register**` **body:**

```json
{
  "clientName": "production",
  "options": null
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Client registered",
  "clientId": 1
}
```

### Containers `/docker/containers`

| Method | Path | Description |
|----|----|----|
| GET | `/containers/all/:clientId` | Get all containers for a client |

**Response:** Array of container objects with stats.

### Manager `/docker/manager`

| Method | Path | Description |
|----|----|----|
| GET | `/manager/pool-stats` | Get worker pool statistics |
| POST | `/manager/init-all-clients` | Initialize all registered clients |

## Metrics Routes `/api/v2/metrics`

### GET `/metrics/`

Returns Prometheus-formatted metrics for the API and database.

**Response 200:** Prometheus text format with:

* HTTP request counters
* Request duration histograms
* Database size and table metrics
* Memory usage statistics

## Plugin Routes `/api/v2/plugins`

```mermaidjs

sequenceDiagram
    participant Client
    participant API
    participant PluginHandler
    participant DB

    Client->>API: POST /plugins/install
    API->>PluginHandler: savePlugin()
    PluginHandler->>DB: INSERT plugin
    DB-->>PluginHandler: success
    PluginHandler-->>API: { success: true, id: 1 }
    API-->>Client: 200 OK

    Client->>API: POST /plugins/activate
    API->>PluginHandler: loadPlugins([1])
    PluginHandler->>DB: SELECT plugin code
    PluginHandler->>PluginHandler: Dynamic import
    PluginHandler-->>API: { successes: [1], errors: [] }
    API-->>Client: 200 OK
```

| Method | Path | Description |
|----|----|----|
| GET | `/plugins/all` | List all installed plugins |
| GET | `/plugins/hooks` | Get available hook handlers |
| GET | `/plugins/status` | Get plugin system status |
| POST | `/plugins/install` | Install a plugin |
| POST | `/plugins/activate` | Activate plugins by ID |
| POST | `/plugins/delete` | Delete a plugin |
| GET | `/plugins/routes` | List plugin-provided routes |
| ALL | `/plugins/:id/routes/*` | Proxy requests to plugin Elysia instance |

**POST** `**/plugins/install**` **body:**

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "repoType": "github",
  "repository": "user/repo",
  "manifest": "manifest.yml",
  "author": { "name": "Author", "email": "a@b.com" },
  "plugin": "/* JS code */"
}
```

**POST** `**/plugins/activate**` **body:**

```json
[1, 2, 3]
```

**Response 200:**

```json
{
  "successes": [1, 2],
  "errors": [{ "pluginId": 3, "error": "..." }]
}
```

## Database Routes `/api/v2/db`

| Method | Path | Description |
|----|----|----|
| GET | `/db/config` | Get current configuration |
| POST | `/db/config` | Update configuration |

**POST** `**/db/config**` **body:** Configuration object matching `DockStatConfigTable` schema from `@dockstat/typings`.

## OpenAPI Documentation

The API exposes OpenAPI documentation via `@elysiajs/openapi` at `/api/v2/docs` using the Scalar provider.

## Error Handling

All routes use a global error handler that returns structured errors:

**Validation Error (400):**

```json
{
  "error": "Validation failed",
  "path": "/api/v2/docker/hosts/add",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Server Error (500):**

```json
{
  "error": "Response validation failed",
  "message": "...",
  "path": "/api/v2/...",
  "timestamp": "..."
}
```

## Authentication

The current API implementation does not enforce authentication at the route level. For production deployments, add an authentication layer via reverse proxy or Elysia middleware.

## Source Files

| File | Description |
|----|----|
| `apps/api/src/index.ts` | API entry point |
| `apps/api/src/routes/docker/index.ts` | Docker route aggregator |
| `apps/api/src/routes/docker/hosts.ts` | Host management routes |
| `apps/api/src/routes/docker/client.ts` | Client management routes |
| `apps/api/src/routes/docker/container.ts` | Container routes |
| `apps/api/src/routes/docker/manager.ts` | Manager routes |
| `apps/api/src/routes/plugins/index.ts` | Plugin routes |
| `apps/api/src/routes/db.ts` | Database configuration routes |
| `apps/api/src/routes/metrics/prometheus.ts` | Metrics endpoint |
| `apps/api/src/models/*.ts` | Request/response schemas |