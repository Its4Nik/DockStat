---
id: e4e04545-fd9f-4fbf-becb-94da81f48bc5
title: Integration guide
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 7dddd764-6483-4f84-96a3-988304e772d3
updatedAt: 2025-12-17T09:45:45.019Z
urlId: SWA5Nd4lzW
---

> Comprehensive guide for integrating DockStat components, packages, and external services. This document covers package interoperability, API integration, plugin development, and third-party service connections.

## Integration Overview

```mermaidjs

graph TB
    subgraph "External Services"
        DOCKER["Docker Daemon"]
        PROM["Prometheus"]
        WEBHOOK["Webhooks"]
        NOTIFY["Notification Services"]
    end

    subgraph "DockStat Core"
        API["DockStat API"]
        FE["Frontend (React Router)"]
        DN["DockNode"]
        DST["DockStore"]
    end

    subgraph "Shared Packages"
        DC["@dockstat/docker-client"]
        DB["@dockstat/db"]
        PH["@dockstat/plugin-handler"]
        LOG["@dockstat/logger"]
        TYP["@dockstat/typings"]
    end

    DOCKER --> DC
    DC --> API
    API --> FE
    API --> PROM
    PH --> WEBHOOK
    PH --> NOTIFY
    DN --> API
    DST --> PH
    DB --> API
    LOG --> API
    LOG --> DC
    TYP --> API
    TYP --> FE
```

## Package Integration

### Core Package Dependencies

```mermaidjs

graph BT
    subgraph "Foundation Layer"
        SW["@dockstat/sqlite-wrapper"]
        LOG["@dockstat/logger"]
        TYP["@dockstat/typings"]
        UTILS["@dockstat/utils"]
    end

    subgraph "Service Layer"
        DB["@dockstat/db"]
        DC["@dockstat/docker-client"]
        PH["@dockstat/plugin-handler"]
    end

    subgraph "Presentation Layer"
        UI["@dockstat/ui"]
    end

    subgraph "Applications"
        API["apps/api"]
        FE["apps/dockstat"]
    end

    DB --> SW
    DB --> TYP
    DC --> SW
    DC --> LOG
    DC --> TYP
    DC --> UTILS
    PH --> SW
    PH --> LOG
    PH --> TYP
    UI --> TYP
    UI --> UTILS
    API --> DB
    API --> DC
    API --> PH
    API --> LOG
    FE --> UI
    FE --> TYP
```

### Database Integration

The database layer provides the foundation for all data persistence:

```typescript
import DockStatDB from "@dockstat/db";
import DockerClient from "@dockstat/docker-client";
import PluginHandler from "@dockstat/plugin-handler";

// Initialize the database

const db = new DockStatDB();

// Share database instance with Docker client

const dockerClient = new DockerClient(db.getDB(), {
  enableMonitoring: true
});

// Share database instance with plugin handler

const pluginHandler = new PluginHandler(db.getDB());

// All components now share the same SQLite database
```

### Logger Integration

Integrate the logger across all services:

```typescript
import Logger from "@dockstat/logger";

// Create service-specific loggers

const apiLogger = new Logger("API");
const dockerLogger = new Logger("Docker");
const pluginLogger = new Logger("Plugins");

// Spawn child loggers for sub-components

const routeLogger = apiLogger.spawn("Routes");
const containerLogger = dockerLogger.spawn("Container");

// Use request ID tracking for distributed tracing

function handleRequest(req: Request) {
  const reqId = req.headers.get("x-request-id") || crypto.randomUUID();
  
  apiLogger.info("Request received", reqId);
  routeLogger.debug("Processing route", reqId);
  
  return processRequest(req, reqId);
}
```

### Type Safety Integration

Use shared types across all packages:

```typescript
import type { DOCKER, PLUGIN, THEME, DATABASE } from "@dockstat/typings";
import { schemas } from "@dockstat/typings/schemas";
import { Value } from "@sinclair/typebox/value";

// Type-safe Docker host configuration

const host: DOCKER.HostConfig = {
  id: 1,
  host: "192.168.1.100",
  port: 2375,
  secure: false,
  name: "Production Host"
};

// Runtime validation

if (Value.Check(schemas.HostConfigSchema, host)) {
  // host is validated
  await dockerClient.addHost(host);
}

// Type-safe plugin definition

const plugin: PLUGIN.Plugin = {
  id: 1,
  name: "my-plugin",
  version: "1.0.0",
  config: {
    // Type-checked configuration
  }
};
```

## API Integration

### Frontend to Backend Integration

```mermaidjs

sequenceDiagram
    participant Browser as "Browser"
    participant FE as "Frontend (React Router)"
    participant Eden as "Eden Client"
    participant API as "API (Elysia)"
    participant DC as "DockerClient"
    participant Docker as "Docker Daemon"

    Browser->>FE: "User Action"
    FE->>Eden: "Type-safe API call"
    Eden->>API: "HTTP Request"
    API->>DC: "Docker operation"
    DC->>Docker: "Docker API call"
    Docker-->>DC: "Response"
    DC-->>API: "Processed data"
    API-->>Eden: "JSON Response"
    Eden-->>FE: "Typed response"
    FE-->>Browser: "Updated UI"
```

### Eden Client Setup

```typescript
// apps/dockstat/app/api.ts

import { treaty } from "@elysiajs/eden";
import type { TreatyType } from "../../api/src/index";

// Create type-safe API client

export const api = treaty<TreatyType>("http://localhost:9876");

// Usage in React components

async function fetchContainers(clientId: number) {
  const { data, error } = await api.api.v2.docker.containers.all[clientId].get();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}
```

### Direct API Integration

For external services integrating with DockStat:

```typescript
// External service integration

const DOCKSTAT_API = "http://localhost:9876/api/v2";

// Register a new Docker client

async function registerClient(name: string) {
  const response = await fetch(`${DOCKSTAT_API}/docker/client/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientName: name })
  });
  
  const result = await response.json();
  return result.clientId;
}

// Add a Docker host

async function addHost(clientId: number, config: HostConfig) {
  const response = await fetch(`${DOCKSTAT_API}/docker/hosts/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, ...config })
  });
  
  return response.json();
}

// Get container stats

async function getContainerStats(clientId: number) {
  const response = await fetch(`${DOCKSTAT_API}/docker/containers/all/${clientId}`);
  return response.json();
}
```

## Docker Integration

### Docker Daemon Connection

```mermaidjs

graph TB
    subgraph "Connection Types"
        SOCKET["Unix Socket"]
        TCP["TCP Connection"]
        TLS["TLS/SSL"]
        SSH["SSH Tunnel"]
    end

    subgraph "DockerClient"
        DCM["DockerClientManager"]
        WORKER["Worker Pool"]
        MONITOR["Monitoring Manager"]
    end

    subgraph "Docker Hosts"
        LOCAL["Local Docker"]
        REMOTE1["Remote Host 1"]
        REMOTE2["Remote Host 2"]
    end

    SOCKET --> LOCAL
    TCP --> REMOTE1
    TLS --> REMOTE2
    DCM --> WORKER
    WORKER --> SOCKET
    WORKER --> TCP
    WORKER --> TLS
    MONITOR --> WORKER
```

### Local Docker Socket

```typescript
import DockerClient from "@dockstat/docker-client";

const client = new DockerClient(db.getDB(), {
  enableMonitoring: true
});

// Register local client using Unix socket

const clientId = await client.registerClient("local");

// Add local Docker host

await client.addHost({
  id: 1,
  clientId,
  host: "/var/run/docker.sock",
  name: "Local Docker",
  secure: false,
  port: 0 // Not used for socket connections
});
```

### Remote Docker Host (TCP)

```typescript
// Remote Docker host over TCP

await client.addHost({
  id: 2,
  clientId,
  host: "192.168.1.100",
  port: 2375,
  name: "Remote Docker",
  secure: false
});
```

### Secure Docker Host (TLS)

```typescript
// Remote Docker host with TLS

await client.addHost({
  id: 3,
  clientId,
  host: "production.docker.local",
  port: 2376,
  name: "Production Docker",
  secure: true,
  // TLS certificates would be configured separately
});
```

### Container Event Streaming

```mermaidjs

sequenceDiagram
    participant Client as "DockerClient"
    participant Docker as "Docker Daemon"
    participant Stream as "StreamManager"
    participant WS as "WebSocket"
    participant UI as "Frontend"

    Client->>Docker: "Subscribe to events"
    Docker-->>Stream: "Event stream"
    
    loop "Container Events"
        Docker->>Stream: "Container event"
        Stream->>WS: "Broadcast event"
        WS->>UI: "Real-time update"
    end
```

```typescript
import { StreamManager, STREAM_CHANNELS } from "@dockstat/docker-client";

// Subscribe to container events

const streamManager = new StreamManager();

streamManager.subscribe(STREAM_CHANNELS.CONTAINER_STATS, (stats) => {
  console.log("Container stats:", stats);
});

streamManager.subscribe(STREAM_CHANNELS.CONTAINER_EVENTS, (event) => {
  console.log("Container event:", event.Action, event.Actor.ID);
});
```

## Plugin Integration

### Plugin System Architecture

```mermaidjs

graph TB
    subgraph "Plugin Lifecycle"
        INSTALL["Install"]
        LOAD["Load"]
        ACTIVATE["Activate"]
        RUN["Running"]
        DEACTIVATE["Deactivate"]
        UNLOAD["Unload"]
        DELETE["Delete"]
    end

    subgraph "Plugin Capabilities"
        ROUTES["API Routes"]
        TABLES["Database Tables"]
        HOOKS["Event Hooks"]
        ACTIONS["Action Chains"]
    end

    INSTALL --> LOAD
    LOAD --> ACTIVATE
    ACTIVATE --> RUN
    RUN --> DEACTIVATE
    DEACTIVATE --> UNLOAD
    UNLOAD --> DELETE

    RUN --> ROUTES
    RUN --> TABLES
    RUN --> HOOKS
    RUN --> ACTIONS
```

### Installing Plugins

```typescript
import PluginHandler from "@dockstat/plugin-handler";

const handler = new PluginHandler(db.getDB());

// Install from GitHub manifest URL

await handler.installFromManifestLink(
  "https://raw.githubusercontent.com/user/plugin/main/manifest.yml"
);

// Or install directly

const result = await handler.savePlugin({
  name: "my-plugin",
  version: "1.0.0",
  repository: "https://github.com/user/plugin",
  manifest: "https://github.com/user/plugin/manifest.yml",
  author: { name: "Developer", email: "dev@example.com" },
  tags: ["monitoring"],
  repoType: "github",
  plugin: pluginCode
});
```

### Plugin Route Integration

```typescript
// Plugin with custom API routes

const plugin = {
  name: "metrics-plugin",
  version: "1.0.0",
  config: {
    table: {
      name: "metrics_data",
      columns: {
        id: column.id(),
        metric_name: column.text({ notNull: true }),
        value: column.real(),
        timestamp: column.createdAt()
      }
    },
    apiRoutes: {
      "/metrics": {
        method: "GET",
        actions: ["getMetrics"]
      },
      "/metrics/:name": {
        method: "GET",
        actions: ["getMetricByName"]
      },
      "/metrics": {
        method: "POST",
        actions: ["validateMetric", "saveMetric"]
      }
    },
    actions: {
      getMetrics: ({ table }) => {
        return table.select(["*"]).orderBy("timestamp").desc().all();
      },
      getMetricByName: ({ table, params }) => {
        return table.select(["*"]).where({ metric_name: params.name }).all();
      },
      validateMetric: ({ body }) => {
        if (!body.name || body.value === undefined) {
          throw new Error("Invalid metric data");
        }
        return { valid: true, data: body };
      },
      saveMetric: ({ table, previousResult }) => {
        const { data } = previousResult;
        return table.insert({
          metric_name: data.name,
          value: data.value
        });
      }
    }
  }
};
```

### Event Hook Integration

```typescript
// Plugin with Docker event hooks

const eventPlugin = {
  name: "container-logger",
  version: "1.0.0",
  config: {
    table: {
      name: "container_events",
      columns: {
        id: column.id(),
        container_id: column.text(),
        event_type: column.text(),
        timestamp: column.createdAt()
      }
    }
  },
  events: {
    onContainerStart: async ({ container, logger, table }) => {
      logger.info(`Container started: ${container.id}`);
      await table.insert({
        container_id: container.id,
        event_type: "start"
      });
    },
    onContainerStop: async ({ container, logger, table }) => {
      logger.info(`Container stopped: ${container.id}`);
      await table.insert({
        container_id: container.id,
        event_type: "stop"
      });
    },
    onContainerRestart: async ({ container, logger, table }) => {
      logger.info(`Container restarted: ${container.id}`);
      await table.insert({
        container_id: container.id,
        event_type: "restart"
      });
    }
  }
};
```

## DockNode Integration

### DockNode Architecture

```mermaidjs

graph TB
    subgraph "DockStat Main"
        API["DockStat API"]
        UI["Frontend"]
    end

    subgraph "Remote Nodes"
        DN1["DockNode 1"]
        DN2["DockNode 2"]
        DN3["DockNode 3"]
    end

    subgraph "Docker Hosts"
        DH1["Docker Host A"]
        DH2["Docker Host B"]
        DH3["Docker Host C"]
    end

    API --> DN1
    API --> DN2
    API --> DN3
    DN1 --> DH1
    DN2 --> DH2
    DN3 --> DH3
    UI --> API
```

### DockNode Connection

```typescript
// DockNode client integration

const DOCKNODE_URL = "http://remote-node:4000/api";

// Deploy a stack to remote node
async function deployStack(nodeUrl: string, stack: StackConfig) {
  const response = await fetch(`${nodeUrl}/dockstack/deploy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({
      id: stack.id,
      name: stack.name,
      data: stack.composeFile,
      vars: stack.variables
    })
  });
  
  return response.json();
}

// Delete a stack from remote node
async function deleteStack(nodeUrl: string, stackId: number, name: string) {
  const response = await fetch(`${nodeUrl}/dockstack/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({ id: stackId, name })
  });
  
  return response.json();
}
```

### Authentication

```typescript
// DockNode authentication configuration

const authConfig = {
  // Production: Pre-shared key
  psk: process.env.DOCKNODE_DOCKSTACK_AUTH_PSK,
  
  // Development: Dev auth key
  devAuth: process.env.DOCKNODE_DOCKSTACK_DEV_AUTH,
  
  // Priority: 'psk' | 'dev' | 'none'
  priority: process.env.DOCKNODE_DOCKSTACK_AUTH_PRIORITY || 'psk'
};
```

## DockStore Integration

### Template Installation

```mermaidjs

sequenceDiagram
    participant User as "User"
    participant UI as "DockStat UI"
    participant API as "DockStat API"
    participant DST as "DockStore"
    participant PH as "PluginHandler"

    User->>UI: "Browse templates"
    UI->>DST: "Fetch template list"
    DST-->>UI: "Available templates"
    User->>UI: "Select template"
    UI->>API: "Install template"
    API->>DST: "Download template"
    DST-->>API: "Template files"
    API->>PH: "Register plugin"
    PH-->>API: "Plugin installed"
    API-->>UI: "Installation complete"
```

### Plugin Installation from DockStore

```typescript
// Install a plugin from DockStore

async function installFromDockStore(pluginName: string) {
  const manifestUrl = `https://raw.githubusercontent.com/Its4Nik/DockStat/main/apps/dockstore/src/content/plugins/${pluginName}/manifest.yml`;
  
  const result = await pluginHandler.installFromManifestLink(manifestUrl);
  
  if (result.success) {
    // Activate the plugin
    await pluginHandler.loadPlugins([result.id]);
  }
  
  return result;
}
```

## Prometheus Integration

### Metrics Endpoint

```mermaidjs

graph LR
    subgraph "DockStat"
        API["API Server"]
        METRICS["/api/v2/metrics"]
    end

    subgraph "Prometheus"
        SCRAPER["Scraper"]
        STORAGE["Time Series DB"]
    end

    subgraph "Visualization"
        GRAFANA["Grafana"]
    end

    API --> METRICS
    SCRAPER --> METRICS
    SCRAPER --> STORAGE
    STORAGE --> GRAFANA
```

### Prometheus Configuration

```yaml
# prometheus.yml

scrape_configs:
  - job_name: 'dockstat'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:9876']
    metrics_path: '/api/v2/metrics'
```

### Available Metrics

```prometheus
# HTTP request metrics
http_requests_total{method="GET", path="/api/v2/docker/containers/all", status="200"} 1234
http_request_duration_seconds_bucket{method="GET", path="/api/v2/docker/containers/all", le="0.1"} 1000

# Database metrics
dockstat_db_size_bytes 1048576
dockstat_db_table_count 5

# Docker metrics
dockstat_containers_total{host="local"} 15
dockstat_containers_running{host="local"} 12

# Memory metrics
process_resident_memory_bytes 52428800
```

## Webhook Integration

### Outgoing Webhooks

```typescript
// Plugin with webhook notifications

const webhookPlugin = {
  name: "webhook-notifier",
  version: "1.0.0",
  config: {
    table: {
      name: "webhook_config",
      columns: {
        id: column.id(),
        url: column.text({ notNull: true }),
        events: column.json(),
        active: column.boolean()
      },
      jsonColumns: ["events"]
    }
  },
  events: {
    onContainerStart: async ({ container, table }) => {
      const webhooks = await table
        .select(["*"])
        .where({ active: true })
        .all();
      
      for (const webhook of webhooks) {
        if (webhook.events.includes("container.start")) {
          await fetch(webhook.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "container.start",
              container: {
                id: container.id,
                name: container.Names[0],
                image: container.Image
              },
              timestamp: new Date().toISOString()
            })
          });
        }
      }
    }
  }
};
```

### Incoming Webhooks

```typescript
// Elysia route for incoming webhooks
app.post("/api/v2/webhooks/:source", async ({ params, body }) => {
  const { source } = params;
  
  switch (source) {
    case "github":
      return handleGitHubWebhook(body);
    case "docker-hub":
      return handleDockerHubWebhook(body);
    default:
      return { error: "Unknown webhook source" };
  }
});
```

## React Component Integration

### Using DockStat UI Components

```typescript
import { Card, Button, Badge, Table } from "@dockstat/ui";

function ContainerList({ containers }) {
  return (
    <Card title="Containers" subtitle="Running containers">
      <Table
        columns={[
          { key: "name", label: "Name" },
          { key: "image", label: "Image" },
          { key: "status", label: "Status" }
        ]}
        data={containers.map(c => ({
          name: c.Names[0],
          image: c.Image,
          status: (
            <Badge variant={c.State === "running" ? "success" : "warning"}>
              {c.State}
            </Badge>
          )
        }))}
      />
      <Button onClick={() => refreshContainers()}>
        Refresh
      </Button>
    </Card>
  );
}
```

### Theme Integration

```typescript
import DockStatDB from "@dockstat/db";
import type { THEME } from "@dockstat/typings";

// Load current theme
const db = new DockStatDB();
const theme = db.getCurrentTheme();

// Apply theme variables to CSS
function applyTheme(theme: THEME.THEME_config) {
  const root = document.documentElement;
  
  // Apply background
  const bg = theme.vars.background_effect;
  if ("Gradient" in bg) {
    root.style.setProperty("--bg-from", bg.Gradient.from);
    root.style.setProperty("--bg-to", bg.Gradient.to);
    root.style.setProperty("--bg-direction", bg.Gradient.direction);
  }
  
  // Apply component styles
  const card = theme.vars.components.Card;
  root.style.setProperty("--card-accent", card.accent);
  root.style.setProperty("--card-border", card.border);
}
```

## Testing Integration

### Integration Test Setup

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import DockStatDB from "@dockstat/db";
import DockerClient from "@dockstat/docker-client";
import PluginHandler from "@dockstat/plugin-handler";

describe("Integration Tests", () => {
  let db: DockStatDB;
  let dockerClient: DockerClient;
  let pluginHandler: PluginHandler;

  beforeAll(() => {
    db = new DockStatDB();
    dockerClient = new DockerClient(db.getDB(), { enableMonitoring: false });
    pluginHandler = new PluginHandler(db.getDB());
  });

  afterAll(() => {
    db.close();
  });

  it("should share database between components", () => {
    const dbPath1 = db.getDatabasePath();
    // Docker client and plugin handler use the same DB
    expect(dbPath1).toBeDefined();
  });

  it("should install and load plugins", async () => {
    const result = await pluginHandler.savePlugin({
      name: "test-plugin",
      version: "1.0.0",
      // ... plugin config
    });
    
    expect(result.success).toBe(true);
    
    const loaded = await pluginHandler.loadPlugins([result.id]);
    expect(loaded.successes).toContain(result.id);
  });
});
```

## Best Practices

### Error Handling

```typescript
import Logger from "@dockstat/logger";

const log = new Logger("Integration");

async function safeApiCall<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    log.error(`${context}: ${error.message}`);
    return null;
  }
}

// Usage
const containers = await safeApiCall(
  () => dockerClient.getAllContainers(clientId),
  "Fetching containers"
);
```

### Resource Cleanup

```typescript
// Proper cleanup on shutdown
process.on("SIGTERM", async () => {
  log.info("Shutting down gracefully...");
  
  // Stop monitoring
  await dockerClient.stopAllMonitoring();
  
  // Unload plugins
  await pluginHandler.unloadAllPlugins();
  
  // Close database
  db.close();
  
  process.exit(0);
});
```

### Connection Pooling

```typescript
// Reuse database and client instances
class ServiceContainer {
  private static db: DockStatDB;
  private static dockerClient: DockerClient;
  private static pluginHandler: PluginHandler;

  static getDB(): DockStatDB {
    if (!this.db) {
      this.db = new DockStatDB();
    }
    return this.db;
  }

  static getDockerClient(): DockerClient {
    if (!this.dockerClient) {
      this.dockerClient = new DockerClient(this.getDB().getDB(), {
        enableMonitoring: true
      });
    }
    return this.dockerClient;
  }

  static getPluginHandler(): PluginHandler {
    if (!this.pluginHandler) {
      this.pluginHandler = new PluginHandler(this.getDB().getDB());
    }
    return this.pluginHandler;
  }
}
```

## Related Documentation

| Section | Description |
|----|----|
| [Architecture](/doc/d56ca448-563a-4206-9585-c45f8f6be5cf) | System design and component relationships |
| [API Reference](/doc/b174143d-f906-4f8d-8cb5-9fc96512e575) | Complete API endpoint documentation |
| [Configuration](/doc/dec1cb2c-9a13-4e67-a31c-d3a685391208) | Configuration options and settings |
| [Packages](./packages/) | Individual package documentation |
| [Troubleshooting](/doc/88a5f959-3f89-4266-9d8e-eb50193425b0) | Common issues and solutions |