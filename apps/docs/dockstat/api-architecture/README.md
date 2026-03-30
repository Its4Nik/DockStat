id: api-architecture-overview
title: API Architecture Overview
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 7dddd764-6483-4f84-96a3-988304e772d3
updatedAt: 2026-01-01T15:02:00.000Z
urlId: api-architecture-overview
---

> The DockStat API is a modern, high-performance web API built on Bun and Elysia, designed to manage Docker containers, handle real-time monitoring, and provide extensible plugin capabilities.

## High-Level Architecture

The DockStat API follows a layered architecture with clear separation of concerns, enabling maintainability and scalability.

```mermaid
graph TB
    subgraph "Client Layer"
        WebUI[Web UI]
        CLIs[CLI Tools]
        ExtAPI[External APIs]
    end

    subgraph "API Layer (apps/api)"
        Elysia[Elysia Server]
        Prefix[Prefix: /api/v2]
        CORS[CORS Plugin]
        OpenAPI[OpenAPI Docs]
        ServerTiming[Server Timing]
    end

    subgraph "Route Handlers"
        DockerRoutes[Docker Routes]
        PluginRoutes[Plugin Routes]
        DBRoutes[DB Routes]
        GraphRoutes[Graph Routes]
        StatusRoutes[Status Routes]
        MiscRoutes[Misc Routes]
        NodeRoutes[DockNode Routes]
        ThemeRoutes[Theme Routes]
        WSRoutes[WebSocket Routes]
    end

    subgraph "Middleware & Handlers"
        RequestLogger[Request Logger]
        MetricsMiddleware[Metrics Middleware]
        ErrorHandler[Global Error Handler]
        Validation[Typebox Validation]
    end

    subgraph "Core Services"
        DCM[DockerClientManager]
        PH[PluginHandler]
        DockStatDB[DockStatDB]
        Logger[BaseLogger]
    end

    subgraph "WebSocket Services"
        LogSocket[Log Socket]
        RssSocket[RSS Socket]
    end

    subgraph "External Dependencies"
        DockerD[(Docker Daemons)]
        SQLite[(SQLite DB)]
        Repositories[Git Repositories]
    end

    WebUI -->|HTTP/WS| Elysia
    CLIs -->|HTTP| Elysia
    ExtAPI -->|HTTP| Elysia
    
    Elysia --> Prefix
    Prefix --> CORS
    CORS --> OpenAPI
    OpenAPI --> ServerTiming
    ServerTiming --> RequestLogger
    RequestLogger --> MetricsMiddleware
    MetricsMiddleware --> ErrorHandler
    
    ErrorHandler --> DockerRoutes
    ErrorHandler --> PluginRoutes
    ErrorHandler --> DBRoutes
    ErrorHandler --> GraphRoutes
    ErrorHandler --> StatusRoutes
    ErrorHandler --> MiscRoutes
    ErrorHandler --> NodeRoutes
    ErrorHandler --> ThemeRoutes
    ErrorHandler --> WSRoutes
    
    DockerRoutes --> DCM
    PluginRoutes --> PH
    DBRoutes --> DockStatDB
    ThemeRoutes --> DockStatDB
    NodeRoutes --> PH
    WSRoutes --> LogSocket
    WSRoutes --> RssSocket
    
    DCM --> DockerD
    DockStatDB --> SQLite
    PH --> Repositories
    
    LogSocket --> Logger
    Logger -.->|Logging| DCM
    Logger -.->|Logging| PH
    Logger -.->|Logging| DockStatDB
```

## Core Components

### 1. Elysia Server

The Elysia server serves as the HTTP/websocket framework and is the entry point for all API requests.

**Configuration:**
- **Base URL Prefix**: `/api/v2`
- **Default Port**: `3030` (configurable via `DOCKSTATAPI_PORT`)
- **Precompilation**: Enabled for performance
- **Runtime**: Bun

**Key Features:**
- Type-safe route definitions with TypeScript
- Automatic OpenAPI documentation generation
- Built-in request/response validation using Typebox
- WebSocket support with typed interfaces
- Plugin architecture for extensibility

### 2. Middleware Stack

The API employs a layered middleware approach that processes requests in a specific order.

```mermaid
sequenceDiagram
    participant Client
    participant CORS
    participant OpenAPI
    participant ServerTiming
    participant RequestLogger
    participant MetricsMiddleware
    participant RouteHandler
    participant ErrorHandler

    Client->>CORS: HTTP Request
    CORS->>OpenAPI: Check preflight
    OpenAPI->>ServerTiming: Start timing
    ServerTiming->>RequestLogger: Log incoming
    RequestLogger->>MetricsMiddleware: Record start
    MetricsMiddleware->>RouteHandler: Process request
    RouteHandler-->>MetricsMiddleware: Response
    MetricsMiddleware-->>RequestLogger: Record duration
    RequestLogger-->>ServerTiming: End timing
    ServerTiming-->>CORS: Add headers
    CORS-->>Client: HTTP Response
    
    Note over RouteHandler,ErrorHandler: If error occurs
    RouteHandler->>ErrorHandler: Error
    ErrorHandler-->>Client: Formatted error
```

**Middleware Components:**

1. **CORS** (`@elysiajs/cors`)
   - Handles cross-origin requests
   - Essential for web UI integration

2. **OpenAPI** (`@elysiajs/openapi`)
   - Generates interactive API documentation
   - Provider: Scalar
   - Path: `/api/v2/docs`

3. **Server Timing** (`@elysiajs/server-timing`)
   - Tracks request lifecycle timing
   - Configurable via `DOCKSTATAPI_SHOW_TRACES`
   - Measures: parse, handle, transform, beforeHandle, afterHandle, mapResponse, error, total

4. **Request Logger**
   - Logs incoming HTTP requests
   - Captures method, path, status, duration
   - Forwards logs to WebSocket clients

5. **Metrics Middleware**
   - Collects Prometheus-style metrics
   - Tracks request counts and durations
   - Monitors system resources

6. **Global Error Handler**
   - Centralized error processing
   - Structured error responses
   - Differentiates between validation, parse, and internal errors

### 3. Route Organization

Routes are organized by domain and feature, each in its own module.

```mermaid
graph TB
    subgraph "Route Modules"
        Root[apps/api/src/routes/]
        Docker[docker/]
        Plugins[plugins/]
        DB[db.ts]
        Graph[graph/]
        Status[status.ts]
        Misc[misc.ts]
        Node[node/]
        Themes[themes.ts]
        Metrics[metrics/]
    end

    subgraph "Docker Routes"
        DIndex[index.ts]
        DClient[client.ts]
        DHost[hosts.ts]
        DContainer[container.ts]
        DManager[manager.ts]
    end

    subgraph "Plugin Routes"
        PIndex[index.ts]
        PFrontend[frontend.ts]
    end

    subgraph "Metrics Routes"
        MPrometheus[prometheus.ts]
    end

    Root --> Docker
    Root --> Plugins
    Root --> DB
    Root --> Graph
    Root --> Status
    Root --> Misc
    Root --> Node
    Root --> Themes
    Root --> Metrics

    Docker --> DIndex
    Docker --> DClient
    Docker --> DHost
    Docker --> DContainer
    Docker --> DManager

    Plugins --> PIndex
    Plugins --> PFrontend

    Metrics --> MPrometheus
```

**Route Structure by Domain:**

| Domain | Path | Purpose |
|--------|------|---------|
| **Docker** | `/api/v2/docker` | Manage Docker clients, hosts, and containers |
| **Plugins** | `/api/v2/plugins` | Plugin installation, activation, and routing |
| **Database** | `/api/v2/db` | Configuration and data management |
| **Graph** | `/api/v2/graph` | Visual data representations |
| **Status** | `/api/v2/status` | Health and status endpoints |
| **Misc** | `/api/v2/*` | Miscellaneous utility endpoints |
| **DockNode** | `/api/v2/node` | Remote agent integration |
| **Themes** | `/api/v2/themes` | Theme management |
| **WebSockets** | `/ws/*` | Real-time communication |
| **Metrics** | `/api/v2/metrics` | Prometheus metrics |

### 4. Core Services

#### DockerClientManager (DCM)

Manages connections to multiple Docker daemons through a worker pool architecture.

```mermaid
graph TB
    subgraph "DockerClientManager"
        Pool[Worker Pool]
        Clients[Client Registry]
        Hosts[Host Registry]
        Monitor[Monitoring System]
    end

    subgraph "Worker Threads"
        W1[Worker 1]
        W2[Worker 2]
        W3[Worker 3]
        WN[Worker N]
    end

    subgraph "Docker Daemons"
        DD1[Docker Daemon 1]
        DD2[Docker Daemon 2]
        DD3[Docker Daemon 3]
    end

    Pool --> W1
    Pool --> W2
    Pool --> W3
    Pool --> WN

    Clients -->|Assigns| Pool
    Hosts -->|Routes| Pool

    Monitor --> W1
    Monitor --> W2
    Monitor --> W3
    Monitor --> WN

    W1 -->|Docker API| DD1
    W2 -->|Docker API| DD2
    W3 -->|Docker API| DD3
```

**Features:**
- Multi-client support (register multiple Docker environments)
- Worker pool for parallel operations
- Real-time container statistics streaming
- Event-driven monitoring
- Automatic reconnection handling
- Resource usage tracking

#### PluginHandler

Manages the plugin lifecycle and provides extension capabilities.

```mermaid
stateDiagram-v2
    [*] --> Installed: POST /plugins/install
    Installed --> Loaded: POST /plugins/loadPlugins
    Loaded --> Running: Plugin.init()
    Running --> Loaded: Unload
    Loaded --> Installed: Deactivate
    Installed --> [*]: DELETE /plugins/delete
    
    Running --> Registering: Register Routes
    Registering --> Running: Routes Ready
    
    Loaded --> HookSetup: Setup Hooks
    HookSetup --> Loaded: Hooks Ready
```

**Plugin Capabilities:**
- Custom API routes via Elysia instances
- Database table creation and management
- Event hooks for container lifecycle
- Action chains for request/response processing
- Dynamic code loading

#### DockStatDB

Database layer providing access to configuration, plugins, repositories, and metrics.

**Database Schema:**

```mermaid
erDiagram
    CONFIG {
        int id PK
        json hotkeys
        json nav_links
        json additionalSettings
        string current_theme_name
    }
    
    PLUGINS {
        int id PK
        string name UK
        string version
        string description
        string repoType
        string repository
        string manifest
        json author
        json tags
        text plugin
        boolean active
        datetime created_at
        datetime updated_at
    }
    
    REPOSITORIES {
        int id PK
        string name UK
        string policy
        json source
        json verification_api
        string type
        json paths
    }
    
    THEMES {
        string name PK
        string version
        string creator
        string license
        json vars
        datetime created_at
    }
    
    DOCKER_CLIENTS {
        int id PK
        string name UK
        json options
        boolean initialized
    }
    
    HOSTS {
        int id PK
        int docker_client_id FK
        string name
        string host
        int port
        boolean secure
    }
```

### 5. WebSocket Services

Real-time communication channels for logs and RSS feeds.

```mermaid
sequenceDiagram
    participant Client
    participant WebSocket
    participant LogSocket
    participant Logger

    Client->>WebSocket: Connect /ws/logs
    WebSocket->>LogSocket: Register client
    LogSocket-->>Client: Connected
    
    Logger->>LogSocket: New log entry
    LogSocket->>Client: Broadcast log
    
    Client->>WebSocket: Disconnect
    WebSocket->>LogSocket: Unregister
```

**WebSocket Endpoints:**
- `/ws/logs` - Real-time log streaming
- `/ws/rss` - RSS feed updates (planned)

## Data Flow Architecture

### Request Processing Flow

```mermaid
flowchart TD
    Start[Incoming Request] --> CORS1[CORS Check]
    CORS1 --> OpenAPI1[OpenAPI Route Match]
    OpenAPI1 --> Timing[Server Timing Start]
    Timing --> Logger[Request Logging]
    Logger --> Metrics[Metrics Recording Start]
    Metrics --> Validation[Typebox Validation]
    
    Validation -->|Valid| Route[Route Handler]
    Validation -->|Invalid| Error1[400 Validation Error]
    
    Route --> Service[Core Service]
    Service --> External[External System]
    
    External --> Response[Response]
    Response --> Metrics2[Metrics Recording End]
    Metrics2 --> Logger2[Response Logging]
    Logger2 --> Timing2[Server Timing End]
    Timing2 --> CORS2[CORS Headers]
    CORS2 --> Success[200 OK]
    
    External -->|Error| Error2[Service Error]
    Error2 --> ErrorHandler[Global Error Handler]
    ErrorHandler --> ErrorRes[500 Error Response]
    ErrorRes --> Timing2
```

### Container Monitoring Flow

```mermaid
sequenceDiagram
    participant UI as Web UI
    participant API as API
    participant DCM as DockerClientManager
    participant Worker as Worker Thread
    participant Docker as Docker Daemon

    UI->>API: POST /api/v2/docker/client/
    API->>DCM: Register client
    DCM->>DCM: Create worker
    DCM-->>API: Client ID

    UI->>API: POST /api/v2/docker/client/monitoring/start
    API->>DCM: Start monitoring
    DCM->>Worker: Init monitoring loop
    
    loop Monitoring Loop
        Worker->>Docker: GET /containers/json
        Docker-->>Worker: Container list
        Worker->>Docker: GET /containers/:id/stats (stream)
        Docker-->>Worker: Stats updates
        Worker->>DCM: Emit events
    end
    
    DCM->>API: WebSocket push (stats)
    API-->>UI: Real-time updates
```

## Technology Stack

### Runtime & Framework

| Technology | Purpose | Version |
|------------|---------|---------|
| **Bun** | JavaScript runtime | Latest |
| **Elysia** | Web framework | Latest |
| **TypeScript** | Type safety | Latest |

### Core Dependencies

| Package | Purpose |
|---------|---------|
| `@elysiajs/cors` | CORS handling |
| `@elysiajs/eden` | Type-safe client generation |
| `@elysiajs/openapi` | API documentation |
| `@elysiajs/server-timing` | Performance monitoring |
| `@dockstat/db` | Database abstraction |
| `@dockstat/docker-client` | Docker operations |
| `@dockstat/plugin-handler` | Plugin system |
| `@dockstat/logger` | Logging utility |
| `@dockstat/sqlite-wrapper` | Database query builder |
| `@dockstat/typings` | Shared types |

### Utilities

| Package | Purpose |
|---------|---------|
| `dagre` | Graph layout algorithms |
| `@types/dagre` | TypeScript definitions |

## Key Architectural Patterns

### 1. Layered Architecture

Clear separation between:
- **Presentation Layer**: Routes and validation
- **Business Logic Layer**: Core services (DCM, PluginHandler)
- **Data Layer**: Database and external integrations
- **Infrastructure Layer**: Middleware, logging, metrics

### 2. Plugin Architecture

Extensible system allowing:
- Custom route registration
- Event hook registration
- Database table creation
- Dynamic code loading

### 3. Event-Driven Monitoring

Real-time updates through:
- WebSocket connections
- Event emitters
- Streaming responses

### 4. Type Safety

End-to-end type safety with:
- TypeScript for all code
- Typebox schemas for validation
- Eden for client type generation
- Shared types package

### 5. Middleware Pipeline

Ordered processing of requests:
- Pre-processing (CORS, timing)
- Logging and metrics
- Validation
- Route handling
- Error handling

## Scalability Considerations

### Horizontal Scaling

The API is designed for horizontal scaling through:

1. **Stateless Operations**
   - Authentication state not yet implemented
   - Session management via tokens (future)
   - WebSocket affinity requirements

2. **Worker Pool Architecture**
   - DockerClientManager uses worker threads
   - Configurable worker limits
   - Parallel operation support

3. **Database Design**
   - SQLite for single-instance deployments
   - Can be migrated to PostgreSQL for distributed systems
   - Connection pooling support

### Performance Optimizations

1. **Precompilation**
   - Elysia routes precompiled
   - Faster request handling
   - Reduced startup time

2. **Streaming Responses**
   - Container statistics streamed
   - Real-time log streaming
   - Efficient memory usage

3. **Caching**
   - OpenAPI documentation cached
   - Database query caching (via SQLite wrapper)
   - Plugin code caching

## Security Architecture

### Current State

```mermaid
graph TB
    subgraph "Security Layers"
        Env[Environment Variables]
        DBPath[Database Path]
        DockerConn[Docker Connections]
    end
    
    subgraph "Future Enhancements"
        Auth[Authentication]
        RBAC[Role-Based Access]
        Audit[Audit Logging]
        Encryption[Data Encryption]
    end
    
    Env -.->|Planned| Auth
    DockerConn -.->|Partial| RBAC
    DBPath -.->|Planned| Encryption
```

### Security Considerations

1. **Input Validation**
   - Typebox schemas on all routes
   - Request body validation
   - Parameter sanitization

2. **Error Handling**
   - No sensitive data in error messages
   - Detailed errors in development only
   - Structured error responses

3. **Docker Socket Access**
   - Requires proper file permissions
   - TCP connection support with TLS
   - Connection configuration in database

4. **Future Enhancements**
   - JWT authentication
   - Rate limiting
   - Request signing
   - HTTPS enforcement
   - SQL injection prevention

## Configuration Management

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCKSTATAPI_PORT` | API server port | `3030` |
| `DOCKSTATAPI_SHOW_TRACES` | Enable server timing | `true` |
| `DOCKSTAT_MAX_WORKERS` | Max Docker workers | `200` |
| `DOCKSTAT_LOGGER_FULL_FILE_PATH` | Full log paths | `false` |

### Database Configuration

- **Path**: Automatically managed by `@dockstat/db`
- **Initialization**: Automatic schema creation
- **Migrations**: Manual migration support
- **Backups**: Built-in backup functionality

## Deployment Architecture

### Single-Instance Deployment

```mermaid
graph TB
    subgraph "Server"
        Docker[DockStat Container]
        API[Elysia API]
        FE[Frontend Files]
        DB[(SQLite DB)]
        Socket[Unix Socket]
    end
    
    subgraph "Docker Network"
        Container1[Container 1]
        Container2[Container 2]
        Container3[Container 3]
    end
    
    Docker --> API
    Docker --> FE
    API --> DB
    API --> Socket
    Socket --> Container1
    Socket --> Container2
    Socket --> Container3
```

### Distributed Deployment (Future)

```mermaid
graph TB
    subgraph "API Servers"
        API1[API Instance 1]
        API2[API Instance 2]
        APIN[API Instance N]
    end
    
    subgraph "Shared Infrastructure"
        PG[(PostgreSQL)]
        Redis[(Redis)]
        LB[Load Balancer]
    end
    
    LB --> API1
    LB --> API2
    LB --> APIN
    
    API1 --> PG
    API2 --> PG
    APIN --> PG
    
    API1 --> Redis
    API2 --> Redis
    APIN --> Redis
```

## Extension Points

The API provides several extension points for customization:

1. **Custom Routes**
   - Plugin system allows adding new endpoints
   - Middleware injection points
   - WebSocket extensions

2. **Event Hooks**
   - Container lifecycle events
   - Plugin lifecycle events
   - Database operations
   - Request/response processing

3. **Custom Services**
   - Additional core services
   - External API integrations
   - Background job processing

4. **Database Extensions**
   - Custom table creation via plugins
   - Migration system
   - Query hooks

## Monitoring and Observability

### Built-in Metrics

```mermaid
graph TB
    subgraph "Metrics Collection"
        HTTP[HTTP Requests]
        Duration[Request Duration]
        Memory[Memory Usage]
        Workers[Worker Pool Stats]
        DB[Database Metrics]
    end
    
    subgraph "Outputs"
        Prometheus[Prometheus Endpoint]
        Logs[Structured Logs]
        WebSocket[Real-time Logs]
    end
    
    HTTP --> Prometheus
    Duration --> Prometheus
    Memory --> Prometheus
    Workers --> Prometheus
    DB --> Prometheus
    
    HTTP --> Logs
    Duration --> Logs
    Memory --> Logs
    Workers --> Logs
    DB --> Logs
    
    Logs --> WebSocket
```

### Available Metrics

1. **HTTP Metrics**
   - Request count by method and route
   - Request duration histograms
   - Response status codes

2. **Database Metrics**
   - Query execution time
   - Database size
   - Table row counts

3. **Docker Metrics**
   - Worker pool statistics
   - Active streams
   - Memory usage per worker

4. **System Metrics**
   - API server uptime
   - Memory usage
   - Active connections

## Next Steps

- [ ] Implement authentication middleware
- [ ] Add rate limiting
- [ ] Enhance error monitoring
- [ ] Implement distributed tracing
- [ ] Add comprehensive unit tests
- [ ] Performance benchmarking
- [ ] Security audit
- [ ] API versioning strategy

## Related Documentation

- [API Development Guide](../api-development/README.md)
- [API Patterns](../api-patterns/README.md)
- [WebSocket Documentation](../api-websockets/README.md)
- [Plugin System](../api-plugins/README.md)
- [API Reference](../api-reference/README.md)