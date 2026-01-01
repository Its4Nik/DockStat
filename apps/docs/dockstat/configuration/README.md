---
id: dec1cb2c-9a13-4e67-a31c-d3a685391208
title: Configuration
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 7dddd764-6483-4f84-96a3-988304e772d3
updatedAt: 2026-01-01T14:25:29.337Z
urlId: 3dLW6L8pzR
---

> Complete configuration reference for all DockStat applications and packages. This guide covers environment variables, runtime settings, and configuration files.

## Configuration Overview

```mermaidjs

graph TB
    subgraph "Configuration Sources"
        ENV["Environment Variables"]
        FILES["Configuration Files"]
        DB["Database Config"]
        RUNTIME["Runtime Settings"]
    end

    subgraph "Applications"
        API["apps/api"]
        DS["apps/dockstat"]
        DN["apps/docknode"]
        DST["apps/dockstore"]
    end

    subgraph "Packages"
        LOG["@dockstat/logger"]
        DC["@dockstat/docker-client"]
        DBP["@dockstat/db"]
        PH["@dockstat/plugin-handler"]
    end

    ENV --> API
    ENV --> DS
    ENV --> DN
    ENV --> LOG
    FILES --> API
    FILES --> DS
    DB --> DBP
    DB --> DC
    RUNTIME --> PH
```

## Environment Variables

### API Application (`apps/api`)

| Variable | Type | Default | Description |
|----|----|----|----|
| `DOCKSTAT_MAX_WORKERS` | `number` | `200` | Maximum worker threads for DockerClientManager |
| `DOCKSTATAPI_SHOW_TRACES` | `boolean` | `true` | Enable server timing traces in responses |
| `DOCKSTATAPI_DEFAULT_PLUGIN_DIR` | `string` | `src/plugins/default-plugins` | Default directory for plugin discovery |
| `DOCKSTATAPI_PORT` | `number` | `9876` | API server port |
| `DOCKSTATAPI_HOST` | `string` | `0.0.0.0` | API server host binding |

**Example Configuration:**

```bash
# .env file for apps/api

DOCKSTAT_MAX_WORKERS=100
DOCKSTATAPI_SHOW_TRACES=true
DOCKSTATAPI_DEFAULT_PLUGIN_DIR=./plugins
DOCKSTATAPI_PORT=9876
DOCKSTATAPI_HOST=0.0.0.0
```

### DockNode Application (`apps/docknode`)

| Variable | Type | Default | Description |
|----|----|----|----|
| `DOCKNODE_DOCKSTACK_AUTH_PSK` | `string` | — | Production pre-shared key for authentication |
| `DOCKNODE_DOCKSTACK_DEV_AUTH` | `string` | — | Development authentication key |
| `DOCKNODE_DOCKSTACK_AUTH_PRIORITY` | `string` | `psk` | Authentication method priority (`psk`, `dev`, `none`) |
| `PORT` | `number` | `4000` | DockNode server port |

**Example Configuration:**

```bash
# .env file for apps/docknode

DOCKNODE_DOCKSTACK_AUTH_PSK=your-secure-production-key
DOCKNODE_DOCKSTACK_DEV_AUTH=dev-key-for-testing
DOCKNODE_DOCKSTACK_AUTH_PRIORITY=psk

PORT=4000
```

### Logger Package (`@dockstat/logger`)

| Variable | Type | Default | Description |
|----|----|----|----|
| `DOCKSTAT_LOGGER_FULL_FILE_PATH` | `boolean` | `false` | Show full file paths in log output |
| `DOCKSTAT_LOGGER_IGNORE_MESSAGES` | `string` | — | Comma-separated messages to filter out |
| `DOCKSTAT_LOGGER_DISABLED_LOGGERS` | `string` | — | Comma-separated logger names to disable |
| `DOCKSTAT_LOGGER_ONLY_SHOW` | `string` | — | Only show these loggers (comma-separated) |
| `DOCKSTAT_LOGGER_SEPERATOR` | `string` | `:` | Separator between logger name segments |

**Example Configuration:**

```bash
# Development - verbose logging
DOCKSTAT_LOGGER_FULL_FILE_PATH=true

# Production - filtered logging

DOCKSTAT_LOGGER_DISABLED_LOGGERS=Debug,Trace
DOCKSTAT_LOGGER_ONLY_SHOW=API,Database,Docker
DOCKSTAT_LOGGER_IGNORE_MESSAGES=health check,heartbeat
```

## Configuration Flow

```mermaidjs

sequenceDiagram
    participant App as "Application"
    participant Env as "Environment"
    participant Config as "Config Loader"
    participant DB as "Database"
    participant Runtime as "Runtime Config"

    App->>Env: "Read environment variables"
    Env-->>Config: "ENV values"
    Config->>DB: "Load stored configuration"
    DB-->>Config: "Database settings"
    Config->>Config: "Merge configurations"
    Config->>Runtime: "Apply runtime settings"
    Runtime-->>App: "Initialized configuration"
```

## Database Configuration

### Config Table Schema

The `config` table stores application-wide settings:

```typescript
interface ConfigTable {
  id: number;              // Always 1 (singleton)
  current_theme_name: string;  // Active theme name
}
```

### Accessing Configuration

```typescript
import DockStatDB from "@dockstat/db";

const db = new DockStatDB();

// Get current theme name

const themeName = db.getCurrentThemeName();

// Set theme

db.setTheme("dark-theme");

// Get full theme configuration

const theme = db.getCurrentTheme();
```

## Docker Client Configuration

### Host Configuration

```typescript
import type { DOCKER } from "@dockstat/typings";

const hostConfig: DOCKER.HostConfig = {
  id: 1,
  host: "192.168.1.100",
  port: 2375,
  secure: false,
  name: "Production Docker"
};
```

### Client Options

```typescript
import DockerClient from "@dockstat/docker-client";

const client = new DockerClient(db.getDB(), {
  enableMonitoring: true,
  monitoringInterval: 5000,  // 5 seconds
  maxRetries: 3,
  retryDelay: 1000
});
```

### Monitoring Configuration

```mermaidjs

graph LR
    subgraph "Monitoring Options"
        INT["Interval: 5000ms"]
        RET["Retries: 3"]
        DEL["Delay: 1000ms"]
        STREAM["Streaming: enabled"]
    end

    subgraph "Output Channels"
        WS["WebSocket"]
        POLL["HTTP Polling"]
        EVT["Event Emitter"]
    end

    INT --> WS
    INT --> POLL
    STREAM --> EVT
```

## Plugin Configuration

### Plugin Manifest

Plugins are configured via `manifest.yml`:

```yaml
name: my-plugin

version: 1.0.0

description: Plugin description

author:
  name: Developer Name
  email: dev@example.com

repository: https://github.com/user/plugin

tags:
  - monitoring
  - docker

repoType: github
```

### Plugin Runtime Configuration

```typescript
const pluginConfig = {
  table: {
    name: "plugin_data",
    columns: {
      id: column.id(),
      data: column.json(),
      created_at: column.createdAt()
    },
    jsonColumns: ["data"]
  },
  apiRoutes: {
    "/status": {
      method: "GET",
      actions: ["getStatus"]
    }
  },
  actions: {
    getStatus: ({ table, logger }) => {
      return { status: "active" };
    }
  }
};
```

## Theme Configuration

### Theme Structure

```mermaidjs

graph TB
    subgraph "Theme Configuration"
        META["Metadata"]
        VARS["Variables"]
    end

    subgraph "Metadata"
        NAME["name"]
        VER["version"]
        CREATOR["creator"]
        LIC["license"]
    end

    subgraph "Variables"
        BG["background_effect"]
        COMP["components"]
    end

    subgraph "Background Effects"
        SOLID["Solid"]
        GRAD["Gradient"]
        AURORA["Aurora"]
    end

    subgraph "Components"
        CARD["Card"]
        BTN["Button"]
        NAV["Navbar"]
    end

    META --> NAME
    META --> VER
    META --> CREATOR
    META --> LIC
    VARS --> BG
    VARS --> COMP
    BG --> SOLID
    BG --> GRAD
    BG --> AURORA
    COMP --> CARD
    COMP --> BTN
    COMP --> NAV
```

### Theme Example

```typescript
import type { THEME } from "@dockstat/typings";

const customTheme: THEME.THEME_config = {
  name: "custom-dark",
  version: "1.0.0",
  creator: "Your Name",
  license: "MIT",
  description: "A custom dark theme",
  active: true,
  vars: {
    background_effect: {
      Gradient: {
        from: "#1a1a2e",
        to: "#16213e",
        direction: "to bottom right"
      }
    },
    components: {
      Card: {
        accent: "#0f3460",
        border: "1px solid #e94560",
        border_color: "#e94560",
        border_size: "1px",
        title: {
          font: "Inter",
          color: "#ffffff",
          font_size: "18px",
          font_weight: "600"
        },
        sub_title: {
          font: "Inter",
          color: "#cccccc",
          font_size: "14px",
          font_weight: "400"
        },
        content: {
          font: "Inter",
          color: "#e0e0e0",
          font_size: "14px",
          font_weight: "400"
        }
      }
    }
  }
};
```

## Production Configuration

### Recommended Settings

```mermaidjs

graph TB
    subgraph "Production Config"
        direction TB
        API_PROD["API Settings"]
        LOG_PROD["Logger Settings"]
        DB_PROD["Database Settings"]
        SEC_PROD["Security Settings"]
    end

    API_PROD --> W["Workers: CPU cores × 2"]
    API_PROD --> T["Traces: disabled"]
    
    LOG_PROD --> L1["Disabled: Debug, Trace"]
    LOG_PROD --> L2["Only Show: API, Database"]
    
    DB_PROD --> D1["WAL mode: enabled"]
    DB_PROD --> D2["Foreign keys: ON"]
    
    SEC_PROD --> S1["TLS: enabled"]
    SEC_PROD --> S2["Auth: PSK"]
```

### Production Environment File

```bash
# Production .env

# API Configuration

DOCKSTAT_MAX_WORKERS=16
DOCKSTATAPI_SHOW_TRACES=false
DOCKSTATAPI_PORT=9876

# Logger Configuration

DOCKSTAT_LOGGER_DISABLED_LOGGERS=Debug,Trace,Verbose
DOCKSTAT_LOGGER_FULL_FILE_PATH=false

# DockNode Configuration

DOCKNODE_DOCKSTACK_AUTH_PRIORITY=psk
DOCKNODE_DOCKSTACK_AUTH_PSK=<secure-random-key>

# Database

NODE_ENV=production
```

## Development Configuration

### Development Environment File

```bash
# Development .env

# API Configuration
DOCKSTAT_MAX_WORKERS=4
DOCKSTATAPI_SHOW_TRACES=true
DOCKSTATAPI_PORT=9876

# Logger Configuration - verbose
DOCKSTAT_LOGGER_FULL_FILE_PATH=true

# DockNode Configuration
DOCKNODE_DOCKSTACK_AUTH_PRIORITY=dev
DOCKNODE_DOCKSTACK_DEV_AUTH=dev-key

# Database
NODE_ENV=development
```

## TypeScript Configuration

### Base Configuration (`tsconfig.base.json`)

All packages extend the base TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["bun-types"]
  }
}
```

### Package-Specific Configuration

Each package extends the base config:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Turborepo Configuration

### Pipeline Configuration (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "check-types": {
      "dependsOn": ["^build"]
    }
  }
}
```

## Docker Configuration

### Development Compose (`docker-compose.dev.yaml`)

```yaml
version: '3.8'
services:
  dockstat:
    build:
      context: ./apps/dockstat
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    volumes:
      - ./apps/dockstat:/app
    environment:
      - NODE_ENV=development

  api:
    build:
      context: ./apps/api
    ports:
      - "9876:9876"
    environment:
      - DOCKSTAT_MAX_WORKERS=4
      - DOCKSTATAPI_SHOW_TRACES=true
```

## Configuration Precedence

Configuration values are resolved in the following order (highest to lowest priority):

```mermaidjs

graph TB
    subgraph "Configuration Precedence"
        direction TB
        CLI["1. Command Line Arguments"]
        ENV["2. Environment Variables"]
        LOCAL["3. Local Config Files"]
        DB["4. Database Settings"]
        DEFAULT["5. Default Values"]
    end

    CLI --> ENV
    ENV --> LOCAL
    LOCAL --> DB
    DB --> DEFAULT
```

## Validation

### Runtime Validation with Typebox

```typescript
import { Value } from "@sinclair/typebox/value";
import { schemas } from "@dockstat/typings/schemas";

// Validate configuration at runtime

const config = loadConfig();

if (!Value.Check(schemas.HostConfigSchema, config.host)) {
  throw new Error("Invalid host configuration");
}
```

### Schema Validation

```typescript
import { t } from "elysia";

// Elysia route with validation

app.post("/config", ({ body }) => {
  return updateConfig(body);
}, {
  body: t.Object({
    maxWorkers: t.Number({ minimum: 1, maximum: 1000 }),
    enableTraces: t.Boolean(),
    pluginDir: t.String()
  })
});
```

## Related Documentation

| Section | Description |
|----|----|
| [Architecture](/doc/d56ca448-563a-4206-9585-c45f8f6be5cf) | System design and component relationships |
| [API Reference](/doc/b174143d-f906-4f8d-8cb5-9fc96512e575) | Complete API endpoint documentation |
| [Packages](/doc/bbcefaa2-6bd4-46e8-ae4b-a6b823593e67) | Package-specific configuration details |
| [Troubleshooting](/doc/88a5f959-3f89-4266-9d8e-eb50193425b0) | Configuration-related issues and solutions |