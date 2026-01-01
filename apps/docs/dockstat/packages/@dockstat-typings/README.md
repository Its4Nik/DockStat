---
id: ecb9e07b-37e7-430a-b3fc-eb51515ab9ac
title: "@dockstat/typings"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: bbcefaa2-6bd4-46e8-ae4b-a6b823593e67
updatedAt: 2025-12-29T20:53:30.259Z
urlId: 7Ae5a9YIKb
---

> Centralized TypeScript type definitions and Typebox schemas for the DockStat monorepo.

## Overview

`@dockstat/typings` provides shared type definitions, interfaces, and runtime validation schemas used across all DockStat packages. It ensures type consistency between frontend, backend, and packages.

## Installation

```bash
bun add @dockstat/typings
```

## Exports

The package provides multiple export paths:

```typescript
// Main exports (all types)
import { THEME, DATABASE, DOCKER, ADAPTER, HOTKEY, PLUGIN, EVENTS } from "@dockstat/typings"

// Typebox schemas (runtime validation)
import { schemas } from "@dockstat/typings/schemas"

// Typebox-derived types

import { types } from "@dockstat/typings/types"
```

## Core Type Namespaces

### THEME Types

Theme system types for UI customization:

```typescript
import type { THEME } from "@dockstat/typings"

// Theme configuration

type Config = THEME.THEME_config

type Vars = THEME.THEME_vars

type BackgroundEffect = THEME.THEME_background_effects

type Components = THEME.THEME_components

type FontConfig = THEME.THEME_font_config

// Example usage

const theme: THEME.THEME_config = {
  name: "dark-blue",
  version: "1.0.0",
  creator: "DockStat",
  license: "MIT",
  description: "Dark blue theme",
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
        // ...
      }
    }
  }
}
```

### DATABASE Types

Database schema types for SQLite tables:

```typescript
import type { DATABASE } from "@dockstat/typings"

// Plugin schema

type PluginSchema = DATABASE.DBPluginShemaT

type PluginInsert = DATABASE.DBPluginInsertT

type PluginUpdate = DATABASE.DBPluginUpdateT

// Theme schema

type ThemeSchema = DATABASE.DBThemeSchemaT

// Config schema

type ConfigSchema = DATABASE.DBConfigSchemaT

// Example

const plugin: DATABASE.DBPluginShemaT = {
  id: 1,
  name: "my-plugin",
  version: "1.0.0",
  repository: "https://github.com/user/plugin",
  manifest: "https://github.com/user/plugin/manifest.json",
  author: { name: "Developer" },
  tags: ["monitoring"],
  repoType: "github",
  plugin: "export default { ... }"
}
```

### DOCKER Types

Docker client and container types:

```typescript
import type { DOCKER } from "@dockstat/typings"

// Host configuration

type HostConfig = DOCKER.HostConfig

type Host = DOCKER.Host

type HostWithHealth = DOCKER.HostWithHealth

// Container types

type Container = DOCKER.Container

type ContainerStats = DOCKER.ContainerStats

type ContainerInspect = DOCKER.ContainerInspect

// Client options

type DockerClientOptions = DOCKER.DockerClientOptions

type MonitoringOptions = DOCKER.MonitoringOptions

// Example

const host: DOCKER.HostConfig = {
  id: 1,
  host: "192.168.1.100",
  port: 2375,
  secure: false,
  name: "Docker Host 1"
}
```

### PLUGIN Types

Plugin system types:

```typescript
import type { PLUGIN } from "@dockstat/typings"

// Plugin structure

type Plugin = PLUGIN.Plugin

type PluginConfig = PLUGIN.PluginConfig

type PluginRoute = PLUGIN.PluginRoute

type PluginAction = PLUGIN.PluginAction

type PluginActionContext = PLUGIN.PluginActionContext

// Example

const plugin: PLUGIN.Plugin = {
  id: 1,
  name: "example-plugin",
  version: "1.0.0",
  config: {
    table: {
      name: "plugin_data",
      columns: { /* column definitions */ },
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
        return table.select(["*"]).all()
      }
    }
  }
}
```

### EVENTS Types

Docker event hook types for plugins:

```typescript
import type { EVENTS } from "@dockstat/typings"

// Event context

type EventContext = {
  container?: any
  image?: any
  logger: Logger
  table?: QueryBuilder
}

// Event handlers

const events: EVENTS = {
  onContainerStart: async (ctx) => {
    ctx.logger.info(`Container ${ctx.container.id} started`)
  },
  onContainerStop: async (ctx) => {
    ctx.logger.info(`Container ${ctx.container.id} stopped`)
  },
  onContainerRestart: async (ctx) => { /* ... */ },
  onImagePull: async (ctx) => { /* ... */ },
  onImageRemove: async (ctx) => { /* ... */ }
}
```

### ADAPTER Types

React Router and framework adapter types:

```typescript
import type { ADAPTER } from "@dockstat/typings"

// React Router types

type LoaderData = ADAPTER.LoaderData

type ActionData = ADAPTER.ActionData
```

### HOTKEY Types

Keyboard shortcut configuration:

```typescript
import type { HOTKEY } from "@dockstat/typings"

type HotkeyConfig = HOTKEY.HotkeyConfig

type HotkeyAction = HOTKEY.HotkeyAction

const hotkeys: HOTKEY.HotkeyConfig = {
  search: {
    key: "k",
    ctrl: true,
    action: "openSearch"
  }
}
```

## Typebox Schemas

Runtime validation schemas built with Typebox:

```typescript
import { schemas } from "@dockstat/typings/schemas"
import { types } from "@dockstat/typings/types"

// Docker host schema

const hostSchema = schemas.HostConfigSchema

type HostConfig = types.HostConfigType

// Validate at runtime

import { Value } from "@sinclair/typebox/value"

const data = { /* host data */ }
if (Value.Check(schemas.HostConfigSchema, data)) {
  // data is valid HostConfig
}

// Use in Elysia routes

import { Elysia } from "elysia"

app.post("/hosts", ({ body }) => {
  // body is automatically validated against schema
  return createHost(body)
}, {
  body: schemas.HostConfigSchema
})
```

## Common Use Cases

### API Route Validation

```typescript
import { Elysia } from "elysia"
import { schemas } from "@dockstat/typings/schemas"

new Elysia()
  .post("/api/v2/docker/hosts", ({ body }) => {
    // body is validated as HostConfig
    return addDockerHost(body)
  }, {
    body: schemas.HostConfigSchema,
    response: schemas.HostSchema
  })
```

### Plugin Development

```typescript
import type { PLUGIN, EVENTS } from "@dockstat/typings"
import { column } from "@dockstat/sqlite-wrapper"

const plugin: PLUGIN.Plugin = {
  name: "my-plugin",
  version: "1.0.0",
  config: {
    table: {
      name: "my_data",
      columns: {
        id: column.id(),
        value: column.text()
      }
    },
    apiRoutes: {
      "/data": {
        method: "GET",
        actions: ["getData"]
      }
    },
    actions: {
      getData: (ctx: PLUGIN.PluginActionContext) => {
        return ctx.table?.select(["*"]).all()
      }
    }
  },
  events: {
    onContainerStart: async (ctx) => {
      ctx.logger.info("Container started")
    }
  } satisfies EVENTS
}
```

### Theme Development

```typescript
import type { THEME } from "@dockstat/typings"

const customTheme: THEME.THEME_config = {
  name: "custom-dark",
  version: "1.0.0",
  creator: "Your Name",
  license: "MIT",
  description: "Custom dark theme",
  active: true,
  vars: {
    background_effect: {
      Solid: { color: "#1a1a1a" }
    },
    components: {
      Card: {
        accent: "#007acc",
        border: "1px solid #333",
        border_color: "#333",
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
}
```

### Database Operations

```typescript
import type { DATABASE } from "@dockstat/typings"
import DB from "@dockstat/sqlite-wrapper"

const db = new DB("./dockstat.db")

// Type-safe database operations

const plugins = db.table<DATABASE.DBPluginShemaT>("plugins")
  .select(["id", "name", "version"])
  .where({ repoType: "github" })
  .all()

// Insert with type checking

const newPlugin: DATABASE.DBPluginInsertT = {
  name: "new-plugin",
  version: "1.0.0",
  repository: "https://github.com/user/plugin",
  manifest: "https://github.com/user/plugin/manifest.json",
  author: { name: "Developer" },
  repoType: "github",
  plugin: "export default { ... }"
}
```

## Type Safety Benefits


1. **Compile-Time Checking**: Catch type errors during development
2. **IDE Autocomplete**: Full IntelliSense support across all packages
3. **Runtime Validation**: Typebox schemas validate data at runtime
4. **API Consistency**: Shared types ensure API contracts are maintained
5. **Refactoring Safety**: Changes to types propagate across the monorepo

## Architecture

```
@dockstat/typings
├── src/
│   ├── adapter.ts          # React Router types
│   ├── database.ts         # Database schema types
│   ├── docker-client.ts    # Docker client types
│   ├── events.ts           # Plugin event types
│   ├── hotkeys.ts          # Keyboard shortcut types
│   ├── plugins.ts          # Plugin system types
│   ├── themes.ts           # Theme system types
│   ├── index.ts            # Main export
│   └── typebox/
│       ├── _schemas.ts     # Typebox schemas
│       └── _types.ts       # Derived types
```

## Package Dependencies

Used by:

* `@dockstat/sqlite-wrapper` - Database type definitions
* `@dockstat/docker-client` - Docker types and schemas
* `@dockstat/plugin-handler` - Plugin types
* `@dockstat/db` - Database operations
* `apps/api` - API route validation
* `apps/dockstat` - Frontend type safety

## Best Practices


1. **Import from Namespaces**: Use namespaced imports for clarity

   ```typescript
   import type { DOCKER } from "@dockstat/typings"
   const host: DOCKER.HostConfig = { /* ... */ }
   ```
2. **Use Typebox Schemas**: Validate runtime data with schemas

   ```typescript
   import { schemas } from "@dockstat/typings/schemas"
   ```
3. **Type Assertions**: Use `satisfies` for better inference

   ```typescript
   const plugin = { /* ... */ } satisfies PLUGIN.Plugin
   ```
4. **Extend Types**: Create custom types by extending base types

   ```typescript
   interface CustomHost extends DOCKER.Host {
     customField: string
   }
   ```

## Related Packages

* `@sinclair/typebox` - Runtime type validation
* `@dockstat/sqlite-wrapper` - Type-safe database queries
* `@dockstat/docker-client` - Docker operations with type safety
* `@dockstat/plugin-handler` - Plugin system using these types

## License

Part of the DockStat project. See main repository for license information.

## Contributing

Issues and PRs welcome at [github.com/Its4Nik/DockStat](https://github.com/Its4Nik/DockStat)