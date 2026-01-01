---
id: d56ca448-563a-4206-9585-c45f8f6be5cf
title: Architecture
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 7dddd764-6483-4f84-96a3-988304e772d3
updatedAt: 2026-01-01T15:02:00.248Z
urlId: g3eBa2Z8rL
---

> DockStat is a modular Docker monitoring platform built as a monorepo. The system follows a layered architecture with clear separation between the frontend, backend API, Docker integration, and persistence layers.

## System Overview

```mermaidjs

graph TB
    subgraph User Layer
        Browser[Web Browser]
    end

    subgraph Frontend ["Frontend (apps/dockstat)"]
        RR[React Router SSR]
        Eden[Eden Client]
        UI["@dockstat/ui"]
    end

    subgraph API ["Backend API (apps/api)"]
        Elysia[Elysia Server]
        Routes[Route Handlers]
        Models[Typebox Models]
        Middleware[Metrics Middleware]
    end

    subgraph Core ["Core Services"]
        DCM[DockerClientManager]
        PH[PluginHandler]
        DBL[Database Layer]
    end

    subgraph Packages
        DC["@dockstat/docker-client"]
        PHPkg["@dockstat/plugin-handler"]
        DB["@dockstat/db"]
        SW["@dockstat/sqlite-wrapper"]
        LOG["@dockstat/logger"]
    end

    subgraph External
        Docker[Docker Daemon]
        SQLite[(SQLite DB)]
    end

    Browser --> RR
    RR --> Eden
    Eden -->|HTTP| Elysia
    Elysia --> Routes
    Routes --> DCM
    Routes --> PH
    Routes --> DBL
    DCM --> DC
    PH --> PHPkg
    DBL --> DB
    DB --> SW
    SW --> SQLite
    DC -->|Docker API| Docker
    LOG -.->|Logging| Elysia
    LOG -.-> DCM
    LOG -.-> PH
```

## Component Architecture

### Frontend (`apps/dockstat`)

The frontend is a server-rendered React application using React Router v7. It communicates with the backend via the Eden client (type-safe Elysia client).

```mermaidjs

graph LR
    subgraph SSR
        Entry[entry.server.tsx]
        Root[root.tsx]
        Routes[routes/]
    end

    subgraph Client
        EntryC[entry.client.tsx]
        API[api.ts]
    end

    Entry --> Root
    Root --> Routes
    EntryC --> Root
    API -->|Eden| Backend[Backend API]
```

Key technologies:

* React Router v7 with SSR
* TailwindCSS for styling
* Eden client for type-safe API calls
* Bun runtime

### Backend API (`apps/api`)

The API is an Elysia server with the prefix `/api/v2`. Routes are organized by domain.

```mermaidjs

graph TB
    subgraph Elysia App
        Main[index.ts]
        Plugins[elysia-plugins.ts]
        ErrorHandler[handlers/onError.ts]
    end

    subgraph Routes
        DockerR[routes/docker/]
        PluginsR[routes/plugins/]
        DBR[routes/db.ts]
        MetricsR[routes/metrics/]
    end

    subgraph Services
        DCM[DockerClientManager]
        PH[PluginHandler]
        DockStatDB[Database]
    end

    Main --> Plugins
    Main --> ErrorHandler
    Main --> DockerR
    Main --> PluginsR
    Main --> DBR
    Main --> MetricsR
    DockerR --> DCM
    PluginsR --> PH
    DBR --> DockStatDB
```

Route structure:

* `/docker` — Container and host management
* `/plugins` — Plugin administration
* `/db` — Configuration persistence
* `/metrics` — Prometheus metrics

### Docker Client Manager

The `DockerClientManager` from `@dockstat/docker-client` manages connections to Docker daemons. It uses a worker pool architecture for scalability.

```mermaidjs

sequenceDiagram
    participant API
    participant DCM as DockerClientManager
    participant Worker as Worker Thread
    participant Docker as Docker Daemon

    API->>DCM: registerClient(name, options)
    DCM->>DCM: Create worker
    DCM-->>API: { clientId: 1 }

    API->>DCM: startMonitoring(clientId)
    DCM->>Worker: Start monitoring loop
    Worker->>Docker: GET /containers/json
    Docker-->>Worker: Container list
    Worker->>Docker: GET /containers/:id/stats
    Docker-->>Worker: Stats stream
    Worker-->>DCM: Emit events
```

Features:

* Multi-host support
* Real-time container statistics
* Event-driven monitoring
* Connection pooling
* Automatic reconnection

### Plugin System

The `PluginHandler` from `@dockstat/plugin-handler` manages plugin lifecycle.

```mermaidjs

stateDiagram-v2
    [*] --> Installed: POST /plugins/install
    Installed --> Loaded: POST /plugins/activate
    Loaded --> Running: Plugin initialized
    Running --> Loaded: Unload
    Loaded --> Installed: Deactivate
    Installed --> [*]: POST /plugins/delete
```

Plugin capabilities:

* Custom API routes via Elysia instances
* Database tables via SQLite wrapper
* Event hooks for container lifecycle
* Action chains for request handling

### Database Layer

Data persistence uses SQLite via `@dockstat/sqlite-wrapper`. The `@dockstat/db` package provides a higher-level abstraction for configuration and themes.

```mermaidjs

erDiagram
    config {
        int id PK
        string current_theme_name
    }

    themes {
        string name PK
        string version
        string creator
        string license
        json vars
    }

    plugins {
        int id PK
        string name UK
        string version
        string repoType
        string repository
        string manifest
        json author
        json tags
        text plugin
    }

    hosts {
        int id PK
        int docker_client_id FK
        string name
        string host
        int port
        boolean secure
    }

    docker_clients {
        int id PK
        string name UK
        json options
        boolean initialized
    }
```

## Data Flow

### Container Stats Request

```mermaidjs

sequenceDiagram
    participant Browser
    participant Frontend
    participant API
    participant DCM
    participant Docker

    Browser->>Frontend: Load dashboard
    Frontend->>API: GET /api/v2/docker/containers/all/1
    API->>DCM: getAllContainers(1)
    DCM->>Docker: GET /containers/json
    Docker-->>DCM: Container list
    DCM->>Docker: GET /containers/:id/stats (per container)
    Docker-->>DCM: Stats
    DCM-->>API: Aggregated stats
    API-->>Frontend: JSON response
    Frontend-->>Browser: Render stats
```

### Plugin Route Proxy

```mermaidjs

sequenceDiagram
    participant Client
    participant API
    participant PluginHandler
    participant PluginElysia

    Client->>API: GET /api/v2/plugins/1/routes/custom
    API->>PluginHandler: handleRoute(1, "/custom", request)
    PluginHandler->>PluginHandler: Lookup loaded plugin
    PluginHandler->>PluginElysia: Forward request
    PluginElysia-->>PluginHandler: Response
    PluginHandler-->>API: Response
    API-->>Client: JSON response
```

## Package Dependencies

```mermaidjs

graph BT
    subgraph Apps
        API[apps/api]
        DS[apps/dockstat]
        DN[apps/docknode]
        DST[apps/dockstore]
    end

    subgraph Core Packages
        DC["@dockstat/docker-client"]
        DB["@dockstat/db"]
        PH["@dockstat/plugin-handler"]
    end

    subgraph Foundation
        SW["@dockstat/sqlite-wrapper"]
        LOG["@dockstat/logger"]
        TYP["@dockstat/typings"]
        UTILS["@dockstat/utils"]
    end

    subgraph UI
        UIPKG["@dockstat/ui"]
    end

    API --> DC
    API --> DB
    API --> PH
    API --> LOG
    API --> TYP

    DS --> API
    DS --> UIPKG
    DS --> DB
    DS --> DC
    DS --> LOG
    DS --> TYP

    DN --> LOG

    DST --> PH
    DST --> TYP
    DST --> LOG

    DC --> SW
    DC --> PH
    DC --> LOG
    DC --> TYP
    DC --> UTILS

    DB --> SW
    DB --> TYP

    PH --> SW
    PH --> LOG
    PH --> TYP

    UIPKG --> TYP
    UIPKG --> UTILS
```

## Deployment Architecture

```mermaidjs

graph TB
    subgraph Production

        subgraph DockStat Container
            API[DockStat API]
            FE[Frontend SSR]
        end
    DB[(SQLite Volume)]
    
    end

    subgraph Docker Hosts
        DH1[Docker Host 1]
        DH2[Docker Host 2]
        DH3[Docker Host 3]
    end
    

    FE --> API
    API --> DB
    API --> DH1
    API --> DH2
    API --> DH3
```

For production deployments:


1. Run the frontend and API together or separately
2. Mount SQLite database as a persistent volume
3. Configure Docker socket access or TCP endpoints
4. Set environment variables for logging and worker limits

## Security Considerations

The API does not enforce authentication by default (yet). For production:

* Add authentication middleware to Elysia
* Use a reverse proxy with auth (nginx, Traefik)
* Restrict Docker socket access
* Use TLS for Docker TCP connections (`secure: true`)

## Extension Points

| Extension Point | Description |
|----|----|
| Plugins | Custom routes, DB tables, event hooks |
| Themes | UI theming via `@dockstat/db` |
| Docker Adapters | Extend `@dockstat/docker-client` |
| UI Components | Add to `@dockstat/ui` |