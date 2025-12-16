---
id: 7dddd764-6483-4f84-96a3-988304e772d3
title: DockStat
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: null
updatedAt: 2025-12-16T19:19:22.857Z
urlId: zqa4IyZtl0
---

![](/api/attachments.redirect?id=2c39d8bf-6a65-43f6-9781-287b6950d350 "full-width =2834x274")


:::warning
***DockStat is currently under active alpha-development, expect breaking changes***

:::


---

DockStat is a Docker container monitoring and management platform built as a monorepo. The system consists of a Bun/Elysia backend API, a React Router frontend, companion services (DockNode, DockStore), and shared packages.

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

## Build for Production

Frontend:

```bash
cd apps/dockstat

bun run build

bun run start
```

The frontend Dockerfile at `apps/dockstat/Dockerfile` produces a production image.

## Documentation Index

| Section | Description |
|----|----|
| [API Reference](https://api-reference/) | Endpoint documentation for `/api/v2` |
| [Architecture](https://architecture/) | System design and data flow |
| [Packages](https://packages/) | Shared package documentation |
| [Notifications](https://notifications/) | Notification provider setup |
| [Archive](https://archive/) | Deprecated v1/v3 docs |

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