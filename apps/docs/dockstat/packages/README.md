---
id: bbcefaa2-6bd4-46e8-ae4b-a6b823593e67
title: Packages
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 7dddd764-6483-4f84-96a3-988304e772d3
updatedAt: 2026-01-01T15:02:03.282Z
urlId: waARCz3AZ0
---

# Packages

The DockStat monorepo contains shared packages under `packages/`. These provide reusable functionality across applications.

## Package Overview

```mermaidjs

graph TD
    subgraph Public Packages
        SW["@dockstat/sqlite-wrapper"]
        LOG["@dockstat/logger"]
        TYP["@dockstat/typings"]
        OS["@dockstat/outline-sync"]
        RRE["@dockstat/create-rr-elysia"]
    end

    subgraph Internal Packages
        DB["@dockstat/db"]
        DC["@dockstat/docker-client"]
        PH["@dockstat/plugin-handler"]
        UI["@dockstat/ui"]
        UT["@dockstat/utils"]
    end

    DB --> SW
    DB --> TYP
    DC --> SW
    DC --> PH
    DC --> LOG
    DC --> TYP
    DC --> UT
    PH --> SW
    PH --> LOG
    PH --> TYP
    UI --> TYP
    UI --> UT
```

## Package List

| Package | Version | Description | Public |
|----|----|----|----|
| `@dockstat/sqlite-wrapper` | 1.2.8 | Type-safe SQLite query builder for Bun | Yes |
| `@dockstat/logger` | 1.0.1 | Colorized logging utility with source maps | Yes |
| `@dockstat/typings` | 1.1.0 | Shared TypeScript types and Typebox schemas | Yes |
| `@dockstat/outline-sync` | 1.2.4 | Markdown sync tool for Outline Wiki | Yes |
| `@dockstat/create-rr-elysia` | 1.0.2 | React Router + Elysia project template | Yes |
| `@dockstat/db` | 1.0.0 | Database layer with theme management | No |
| `@dockstat/docker-client` | 1.0.2 | Docker operations via Dockerode | No |
| `@dockstat/plugin-handler` | — | Plugin lifecycle management | No |
| `@dockstat/ui` | 1.0.0 | Shared React UI components | No |
| `@dockstat/utils` | — | Common utilities | No |

## Core Packages

### @dockstat/sqlite-wrapper

Type-safe SQLite wrapper for Bun's `bun:sqlite`. Provides schema-first table definitions and a chainable query builder.

Features:

* Compile-time type validation
* JSON column support
* Generated columns (virtual/stored)
* Foreign key constraints
* WAL mode and PRAGMA management

```typescript
import { DB, column } from "@dockstat/sqlite-wrapper";

const db = new DB("app.db");
const users = db.createTable("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
  email: column.text({ unique: true }),
});

const result = users.select(["id", "name"]).where({ email: "a@b.com" }).first();
```

### @dockstat/docker-client

Docker client library built on Dockerode with real-time monitoring, streaming, and multi-host support.

Features:

* Host and container management
* Real-time statistics streaming
* Event-driven monitoring
* Worker pool architecture
* WebSocket-compatible streaming

```typescript
import DockerClient from "@dockstat/docker-client";

const client = new DockerClient({ enableMonitoring: true });
client.addHost({ id: 1, host: "localhost", name: "local", secure: false });
const containers = await client.getAllContainers();
```

### @dockstat/db

Database abstraction layer for DockStat. Manages themes and provides database access for integration with docker-client.

Features:

* Theme CRUD operations
* Predefined table schemas
* Integration with sqlite-wrapper

```typescript
import DockStatDB from "@dockstat/db";

const db = new DockStatDB();
const theme = db.getCurrentTheme();
db.setTheme("dark-theme");
```

### @dockstat/plugin-handler

Plugin system for DockStat. Manages plugin installation, activation, and execution.

Features:

* Dynamic plugin loading
* Custom database tables per plugin
* API route proxying
* Event hooks

```typescript
import PluginHandler from "@dockstat/plugin-handler";

const handler = new PluginHandler(db);
await handler.loadPlugins([1, 2, 3]);
const result = await handler.handleRoute(1, "/custom", request);
```

### @dockstat/logger

Colorized logging utility with source map support and hierarchical logger naming.

Environment variables:

* `DOCKSTAT_LOGGER_FULL_FILE_PATH` — Show full file paths
* `DOCKSTAT_LOGGER_DISABLED_LOGGERS` — Disable specific loggers
* `DOCKSTAT_LOGGER_ONLY_SHOW` — Show only specific loggers
* `DOCKSTAT_LOGGER_SEPERATOR` — Name separator (default `:`)

```typescript
import Logger from "@dockstat/logger";

const log = new Logger("MyService");
log.info("Starting service");
const child = log.spawn("SubModule");
child.debug("Processing");
```

### @dockstat/typings

Shared TypeScript types and Typebox schemas used across all packages.

Exports:

* `@dockstat/typings` — Main types
* `@dockstat/typings/schemas` — Typebox schemas
* `@dockstat/typings/types` — Type definitions

### @dockstat/ui

React UI component library with TailwindCSS styling. Includes Storybook for development.

```typescript
import { Button, Card } from "@dockstat/ui";
```

## Public Packages (NPM)

The following packages are published to NPM:

* `@dockstat/sqlite-wrapper` — [npm](https://www.npmjs.com/package/@dockstat/sqlite-wrapper)
* `@dockstat/logger` — [npm](https://www.npmjs.com/package/@dockstat/logger)
* `@dockstat/typings` — [npm](https://www.npmjs.com/package/@dockstat/typings)
* `@dockstat/outline-sync` — [npm](https://www.npmjs.com/package/@dockstat/outline-sync)
* `@dockstat/create-rr-elysia` — [npm](https://www.npmjs.com/package/@dockstat/create-rr-elysia)

## Development

Run package-specific commands from the package directory:

```bash
cd packages/sqlite-wrapper

bun run test

bun run lint
```

Build a package:

```bash
cd packages/db

bun run build
```

Check types across all packages:

```bash
bun run check-types
```