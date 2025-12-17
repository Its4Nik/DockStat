---
id: 7dddd764-6483-4f84-96a3-988304e772d3
title: DockStat
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: null
updatedAt: 2025-12-17T09:08:54.373Z
urlId: zqa4IyZtl0
---

![](/api/attachments.redirect?id=2c39d8bf-6a65-43f6-9781-287b6950d350 "full-width =2834x274")


---


:::warning
***DockStat is currently under active alpha-development, expect breaking changes***

:::


---

> ***DockStat is a Docker container monitoring and management platform built as a monorepo. The system consists of a Bun/Elysia backend API, a React Router frontend, companion services (DockNode, DockStore), and shared packages.***

## Documentation Index

| Section | Description |
|----|----|
| [Architecture](./architecture/) | System design, data flow, and component relationships |
| [API Reference](./api-reference/) | Complete REST API endpoint documentation |
| [Applications Overview](./apps-overview) | Guide to all DockStat applications |
| [Configuration](./configuration) | Environment variables and settings |
| [Integration Guide](./integration-guide) | Package interoperability and external integrations |
| [Packages](./packages/) | Shared package documentation |
| [Troubleshooting](./troubleshooting) | Common issues and solutions |

## Architecture

```mermaidjs

graph TB
    subgraph Frontend
        DS[dockstat<br/>React Router SSR]
    end

    subgraph Backend
        API[api<br/>Elysia + Bun]
        DCM[DockerClientManager]
        PH[PluginHandler]
        DB[(SQLite)]
    end

    subgraph Companion
        DN[docknode<br/>Remote Agent]
        DST[dockstore<br/>Plugin Registry]
    end

    subgraph Packages
        PKG_DC["@dockstat/docker-client"]
        PKG_DB["@dockstat/db"]
        PKG_SW["@dockstat/sqlite-wrapper"]
        PKG_PH["@dockstat/plugin-handler"]
        PKG_LOG["@dockstat/logger"]
        PKG_TYP["@dockstat/typings"]
        PKG_UI["@dockstat/ui"]
    end

    DS -->|Eden client| API
    API --> DCM
    API --> PH
    API --> DB
    DCM --> PKG_DC
    PH --> PKG_PH
    DB --> PKG_DB
    PKG_DB --> PKG_SW
    DN -->|Stack deploy| API
    DST -->|Plugin bundles| PH
```

## Repository Structure

```
apps/
├── api/           Backend API (Elysia, prefix /api/v2)
├── dockstat/      Frontend (React Router v7, SSR)
├── docknode/      Remote agent for stack deployment
├── dockstore/     Plugin and theme registry
└── docs/          Documentation (this folder)

packages/
├── db/            Database layer (@dockstat/db)
├── docker-client/ Docker operations (@dockstat/docker-client)
├── logger/        Logging utility (@dockstat/logger)
├── plugin-handler/Plugin system (@dockstat/plugin-handler)
├── sqlite-wrapper/SQLite query builder (@dockstat/sqlite-wrapper)
├── typings/       Shared types (@dockstat/typings)
├── ui/            UI components (@dockstat/ui)
└── utils/         Utilities (@dockstat/utils)
```

## Quick Start

Install dependencies from the monorepo root:

```bash
bun install
```

Start the API in development mode:

```bash
cd apps/api

bun run dev
```

Start the frontend in development mode:

```bash
cd apps/dockstat

bun run dev
```

The API listens on port 9876 by default with prefix `/api/v2`. The frontend dev server runs on port 5173.

## Applications

| Application | Type | Port | Documentation |
|----|----|----|----|
| `dockstat` | Frontend | 5173 / 3000 | [Apps Overview](./apps-overview) |
| `api` | Backend API | 9876 | [API Reference](./api-reference/) |
| `docknode` | Remote Agent | 4000 | [Apps Overview](./apps-overview) |
| `dockstore` | Plugin Registry | — | [Apps Overview](./apps-overview) |

## Packages

| Package | Description | Documentation |
|----|----|----|
| `@dockstat/sqlite-wrapper` | Type-safe SQLite query builder | [Docs](./packages/@dockstat-sqlite-wrapper/) |
| `@dockstat/docker-client` | Docker operations with monitoring | [Docs](./packages/@dockstat-docker-client/) |
| `@dockstat/db` | Database layer with themes | [Docs](./packages/@dockstat-db/) |
| `@dockstat/plugin-handler` | Plugin lifecycle management | [Docs](./packages/@dockstat-plugin-handler/) |
| `@dockstat/logger` | Colorized logging utility | [Docs](./packages/@dockstat-logger/) |
| `@dockstat/typings` | Shared TypeScript types | [Docs](./packages/@dockstat-typings/) |
| `@dockstat/ui` | React UI components | [Docs](./packages/@dockstat-ui/) |
| `@dockstat/utils` | Common utilities | [Docs](./packages/@dockstat-utils/) |

## Environment Variables

### API (`apps/api`)

| Variable | Description | Default |
|----|----|----|
| `DOCKSTAT_MAX_WORKERS` | Max worker threads for DockerClientManager | `200` |
| `DOCKSTATAPI_SHOW_TRACES` | Enable server timing traces | `true` |
| `DOCKSTATAPI_DEFAULT_PLUGIN_DIR` | Default plugin directory | `src/plugins/default-plugins` |

### Logger (`packages/logger`)

| Variable | Description |
|----|----|
| `DOCKSTAT_LOGGER_FULL_FILE_PATH` | Show full file paths in logs |
| `DOCKSTAT_LOGGER_IGNORE_MESSAGES` | Comma-separated messages to ignore |
| `DOCKSTAT_LOGGER_DISABLED_LOGGERS` | Comma-separated logger names to disable |
| `DOCKSTAT_LOGGER_ONLY_SHOW` | Only show these loggers (comma-separated) |
| `DOCKSTAT_LOGGER_SEPERATOR` | Logger name separator (default `:`) |

### DockNode (`apps/docknode`)

| Variable | Description |
|----|----|
| `DOCKNODE_DOCKSTACK_AUTH_PSK` | Production pre-shared key |
| `DOCKNODE_DOCKSTACK_DEV_AUTH` | Development auth key |
| `DOCKNODE_DOCKSTACK_AUTH_PRIORITY` | Auth method priority |
| `PORT` | Server port (default `4000`) |

[Full Configuration Documentation →](./configuration)

## Build for Production

Frontend:

```bash
cd apps/dockstat

bun run build

bun run start
```

The frontend Dockerfile at `apps/dockstat/Dockerfile` produces a production image.

## Tech Stack

| Layer | Technology |
|----|----|
| Runtime | Bun |
| Backend Framework | Elysia |
| Frontend Framework | React Router v7 (SSR) |
| Database | SQLite (via `@dockstat/sqlite-wrapper`) |
| Docker Integration | Dockerode (via `@dockstat/docker-client`) |
| UI Styling | TailwindCSS |
| Type Safety | TypeScript + Typebox schemas |

## Key Features

* **Multi-Host Docker Management**: Manage multiple Docker hosts from a single interface
* **Real-Time Monitoring**: Live container statistics and event streaming
* **Plugin System**: Extensible plugin architecture for custom functionality
* **Theme Support**: CSS variable-based theming system
* **Type Safety**: End-to-end TypeScript with runtime validation

## Getting Help

* **Troubleshooting**: [Common issues and solutions](./troubleshooting)
* **GitHub Issues**: [github.com/Its4Nik/DockStat/issues](https://github.com/Its4Nik/DockStat/issues)
* **Wiki**: [outline.itsnik.de](https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99)

## Contributing

Contributions, ideas and bug reports are welcome. See the main repository README for contribution guidelines.