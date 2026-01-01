---
id: fb89c77f-9f0a-497a-bb24-c41d21b37478
title: Apps overview
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 7dddd764-6483-4f84-96a3-988304e772d3
updatedAt: 2026-01-01T15:02:04.465Z
urlId: YM2LlgAuWf
---

> Complete guide to all applications in the DockStat monorepo. This document covers the purpose, architecture, and interaction patterns of each application.

## Application Ecosystem

```mermaidjs

graph TB
    subgraph "User Interface"
        DS["dockstat<br/>Frontend Application"]
    end

    subgraph "Backend Services"
        API["api<br/>Backend API"]
        DN["docknode<br/>Remote Agent"]
    end

    subgraph "Ecosystem"
        DST["dockstore<br/>Plugin Registry"]
        DOCS["docs<br/>Documentation"]
    end

    subgraph "External"
        DOCKER["Docker Daemons"]
        BROWSER["Web Browser"]
    end

    BROWSER --> DS
    DS -->|"Eden Client"| API
    API --> DOCKER
    API --> DN
    DN --> DOCKER
    DST -->|"Plugin Bundles"| API
    DOCS -->|"Outline Sync"| WIKI["Wiki"]
```

## Application Summary

| Application | Type | Port | Purpose |
|----|----|----|----|
| `dockstat` | Frontend | 5173 (dev) / 3000 (prod) | Main user interface |
| `api` | Backend | 3000 | REST API and Docker management |
| `docknode` | Agent | 4000 | Remote Docker host management |
| `dockstore` | Registry | — | Plugin and template repository |
| `docs` | Documentation | — | Documentation and wiki sync |

## dockstat (Frontend)

### Overview

The main DockStat frontend application built with React Router v7 for server-side rendering. Provides the user interface for container monitoring, management, and configuration.

```mermaidjs

graph TB
    subgraph "Frontend Architecture"
        ENTRY["entry.server.tsx"]
        ROOT["root.tsx"]
        ROUTES["routes/"]
        API_CLIENT["api.ts (Eden)"]
    end

    subgraph "Key Features"
        MONITOR["Container Monitoring"]
        MANAGE["Container Management"]
        THEMES["Theme System"]
        PLUGINS["Plugin UI"]
    end

    subgraph "Technologies"
        RR["React Router v7"]
        TW["TailwindCSS"]
        TS["TypeScript"]
        BUN["Bun Runtime"]
    end

    ENTRY --> ROOT
    ROOT --> ROUTES
    ROUTES --> API_CLIENT
    API_CLIENT -->|"HTTP"| BACKEND["Backend API"]
```

### Directory Structure

```
apps/dockstat/
├── app/
│   ├── .server/          # Server-side utilities
│   ├── routes/           # React Router routes
│   ├── api.ts            # Eden API client
│   ├── app.css           # Global styles
│   ├── entry.client.tsx  # Client entry point
│   ├── entry.server.tsx  # Server entry point
│   ├── root.tsx          # Root component
│   └── routes.ts         # Route definitions
├── public/               # Static assets
├── build/                # Production build output
├── Dockerfile            # Production container
├── react-router.config.ts
├── vite.config.ts
└── package.json
```

### Configuration

```typescript
// react-router.config.ts

import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  future: {
    // Enable future flags
  }
} satisfies Config;
```

### Development

```bash
cd apps/dockstat

bun install

bun run dev
# Available at http://localhost:5173
```

### Production Build

```bash
bun run build

bun run start
# Available at http://localhost:3000
```

### Key Features

* **Server-Side Rendering**: Fast initial page loads with SSR
* **Type-Safe API Calls**: Eden client provides full type safety
* **Theme Support**: CSS variable-based theming system
* **Responsive Design**: TailwindCSS for responsive layouts
* **Hot Module Replacement**: Fast development iteration


---

## api (Backend)

### Overview

The DockStat backend API built with Elysia framework. Handles all Docker operations, plugin management, and data persistence.

```mermaidjs

graph TB
    subgraph "API Architecture"
        ENTRY["index.ts"]
        PLUGINS["elysia-plugins.ts"]
        ROUTES["routes/"]
        HANDLERS["handlers/"]
    end

    subgraph "Core Services"
        DCM["DockerClientManager"]
        PH["PluginHandler"]
        DB["Database Layer"]
    end

    subgraph "Route Groups"
        DOCKER["/docker"]
        PLUGIN["/plugins"]
        METRICS["/metrics"]
        CONFIG["/db"]
    end

    ENTRY --> PLUGINS
    ENTRY --> ROUTES
    ROUTES --> DOCKER
    ROUTES --> PLUGIN
    ROUTES --> METRICS
    ROUTES --> CONFIG
    DOCKER --> DCM
    PLUGIN --> PH
    CONFIG --> DB
```

### Directory Structure

```
apps/api/
├── src/
│   ├── database/         # Database initialization
│   ├── docker/           # Docker client setup
│   ├── handlers/         # Request handlers
│   ├── middleware/       # Elysia middleware
│   ├── models/           # Typebox schemas
│   ├── plugins/          # Default plugins
│   ├── routes/
│   │   ├── docker/       # Docker routes
│   │   ├── metrics/      # Prometheus metrics
│   │   └── plugins/      # Plugin routes
│   ├── utiles/           # Utility functions
│   ├── elysia-plugins.ts # Elysia plugin configuration
│   ├── index.ts          # Main entry point
│   └── logger.ts         # Logger setup
└── package.json
```

### Route Prefix

All API routes are prefixed with `/api/v2`:

| Route Group | Prefix | Purpose |
|----|----|----|
| Docker | `/api/v2/docker` | Container and host management |
| Plugins | `/api/v2/plugins` | Plugin administration |
| Metrics | `/api/v2/metrics` | Prometheus metrics endpoint |
| Database | `/api/v2/db` | Configuration management |

### Configuration

Environment variables:

```bash
DOCKSTAT_MAX_WORKERS=200          # Max worker threads
DOCKSTATAPI_SHOW_TRACES=true      # Enable server timing
DOCKSTATAPI_PORT=9876             # API port
```

### Development

```bash
cd apps/api

bun install

bun run dev
# Available at http://localhost:9876
```

### API Documentation

OpenAPI documentation is available at `/api/v2/docs` using Scalar provider.


---

## docknode (Remote Agent)

### Overview

DockNode is a remote agent for managing Docker hosts that aren't directly accessible from the main DockStat instance. It provides secure stack deployment and management capabilities.

```mermaidjs

graph TB
    subgraph "DockNode Architecture"
        ENTRY["index.ts"]
        DOCKSTACK["DockStackHandler"]
        AUTH["Authentication"]
        BUILDER["Stack Builder"]
    end

    subgraph "Capabilities"
        DEPLOY["Stack Deployment"]
        DELETE["Stack Deletion"]
        STATUS["Status Reporting"]
    end

    subgraph "Security"
        PSK["Pre-Shared Key"]
        DEV["Dev Auth"]
    end

    ENTRY --> DOCKSTACK
    DOCKSTACK --> AUTH
    DOCKSTACK --> BUILDER
    AUTH --> PSK
    AUTH --> DEV
    BUILDER --> DEPLOY
    BUILDER --> DELETE
```

### Directory Structure

```
apps/docknode/
├── src/
│   ├── handlers/
│   │   ├── auth/         # Authentication handlers
│   │   └── dockstack/    # Stack management
│   ├── tests/            # Test files
│   ├── builder.ts        # Docker Compose builder
│   └── index.ts          # Main entry point
├── environment.d.ts      # Type definitions
├── dockerfile            # Production container
└── package.json
```

### API Endpoints

| Method | Endpoint | Description |
|----|----|----|
| GET | `/api/status` | Health check |
| POST | `/api/dockstack/deploy` | Deploy a Docker Compose stack |
| DELETE | `/api/dockstack/delete` | Delete a deployed stack |
| GET | `/api/docs` | OpenAPI documentation |

### Stack Deployment

```typescript
// Deploy request body
{
  "id": 1,
  "name": "my-stack",
  "data": "version: '3.8'\nservices:\n  ...",
  "vars": {
    "DOMAIN": "example.com",
    "PORT": "8080"
  }
}
```

### Authentication

DockNode supports multiple authentication methods:


1. **Pre-Shared Key (PSK)**: For production environments
2. **Dev Auth**: For development and testing

```bash
# Production

DOCKNODE_DOCKSTACK_AUTH_PSK=<secure-random-key>
DOCKNODE_DOCKSTACK_AUTH_PRIORITY=psk

# Development

DOCKNODE_DOCKSTACK_DEV_AUTH=dev-key
DOCKNODE_DOCKSTACK_AUTH_PRIORITY=dev
```

### Development

```bash
cd apps/docknode

bun install

bun run dev
# Available at http://localhost:4000
```


---

## dockstore (Plugin Registry)

### Overview

DockStore is the community hub for Docker Compose templates, themes, and plugins. It provides a curated repository of pre-built configurations.

```mermaidjs

graph TB
    subgraph "DockStore Structure"
        CONTENT["src/content/"]
        PLUGINS["plugins/"]
        UTILS[".utils/"]
    end

    subgraph "Content Types"
        TEMPLATES["Docker Compose Templates"]
        THEME_FILES["Theme Files"]
        PLUGIN_FILES["Plugin Bundles"]
    end

    subgraph "Build Output"
        DIST["dist/"]
        SCHEMAS[".schemas/"]
    end

    CONTENT --> PLUGINS
    PLUGINS --> TEMPLATES
    PLUGINS --> THEME_FILES
    PLUGINS --> PLUGIN_FILES
    PLUGINS -->|"Build"| DIST
```

### Directory Structure

```
apps/dockstore/
├── src/
│   ├── .utils/           # Build utilities
│   └── content/
│       └── plugins/      # Plugin source files
├── .schemas/             # JSON schemas
├── dist/                 # Built plugin bundles
├── bundler.ts            # Plugin bundler
├── manifest.yml          # DockStore manifest
└── package.json
```

### Available Plugins

| Plugin | Description | Tags |
|----|----|----|
| `docknode-plugin` | DockNode connection handler | DockNode, Remote, fs |

### Plugin Manifest Format

```yaml
# manifest.yml

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

### Building Plugins

```bash
cd apps/dockstore

bun run build
# Output in dist/plugins/<name>@<version>/build.js
```


---

## docs (Documentation)

### Overview

The documentation application handles documentation files and synchronization with Outline Wiki. It provides bi-directional sync between local markdown files and the online wiki.

```mermaidjs

graph LR
    subgraph "Local"
        MD["Markdown Files"]
        CONFIG["outline-sync.config.json"]
    end

    subgraph "Sync Process"
        SYNC["outline-sync"]
    end

    subgraph "Remote"
        WIKI["Outline Wiki"]
    end

    MD --> SYNC
    CONFIG --> SYNC
    SYNC <-->|"Bi-directional"| WIKI
```

### Directory Structure

```
apps/docs/
├── dockstat/
│   ├── api-reference/    # API documentation
│   ├── architecture/     # Architecture docs
│   ├── packages/         # Package documentation
│   │   ├── @dockstat-logger/
│   │   ├── @dockstat-plugin-handler/
│   │   └── @dockstat-typings/
│   └── README.md         # Main documentation
└── outline-sync.config.json
```

### Sync Configuration

```json
{
  "apiUrl": "https://outline.itsnik.de",
  "collectionId": "b4a5e48f-f103-480b-9f50-8f53f515cab9",
  "docsPath": "./dockstat"
}
```

### Running Sync

```bash
# Using @dockstat/outline-sync package

bun run sync
```


---

## Application Interactions

### Data Flow

```mermaidjs

sequenceDiagram
    participant User as "User"
    participant FE as "dockstat (Frontend)"
    participant API as "api (Backend)"
    participant DN as "docknode (Agent)"
    participant DST as "dockstore (Registry)"
    participant Docker as "Docker"

    User->>FE: "Access UI"
    FE->>API: "Fetch containers"
    API->>Docker: "List containers"
    Docker-->>API: "Container data"
    API-->>FE: "JSON response"
    FE-->>User: "Display containers"

    User->>FE: "Deploy stack to remote"
    FE->>API: "Deploy request"
    API->>DN: "Deploy stack"
    DN->>Docker: "docker-compose up"
    Docker-->>DN: "Success"
    DN-->>API: "Deployment result"
    API-->>FE: "Success response"
    FE-->>User: "Stack deployed"

    User->>FE: "Install plugin"
    FE->>API: "Install request"
    API->>DST: "Fetch plugin bundle"
    DST-->>API: "Plugin code"
    API->>API: "Register plugin"
    API-->>FE: "Plugin installed"
    FE-->>User: "Plugin ready"
```

### Communication Protocols

| From | To | Protocol | Purpose |
|----|----|----|----|
| Browser | dockstat | HTTP/HTTPS | UI serving |
| dockstat | api | HTTP (Eden) | API calls |
| api | Docker | Unix socket / TCP | Docker operations |
| api | docknode | HTTP | Remote management |
| api | dockstore | HTTP | Plugin fetching |


---

## Development Workflow

### Starting All Applications

```bash
# From monorepo root

bun install

# Start all in development mode

bun run dev

# Or start individually

cd apps/dockstat && bun run dev

cd apps/api && bun run dev

cd apps/docknode && bun run dev
```

### Building for Production

```bash
# Build all applications

bun run build

# Or build individually

cd apps/dockstat && bun run build

cd apps/api && bun run build

cd apps/docknode && bun run build

cd apps/dockstore && bun run build
```

### Testing

```bash
# Run all tests

bun run test

# Run specific app tests

cd apps/api && bun run test
```


---

## Related Documentation

| Section | Description |
|----|----|
| [Architecture](/doc/d56ca448-563a-4206-9585-c45f8f6be5cf) | System design and component relationships |
| [API Reference](/doc/b174143d-f906-4f8d-8cb5-9fc96512e575) | Complete API endpoint documentation |
| [Configuration](/doc/dec1cb2c-9a13-4e67-a31c-d3a685391208) | Environment variables and settings |
| [Integration guide](/doc/e4e04545-fd9f-4fbf-becb-94da81f48bc5) | How applications work together |
| [Packages](/doc/bbcefaa2-6bd4-46e8-ae4b-a6b823593e67) | Shared package documentation |