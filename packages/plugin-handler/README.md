# @dockstat/plugin-handler

> A dynamic plugin system for DockStat that enables runtime loading, execution, and management of plugins stored in a SQLite database.

## Overview

`@dockstat/plugin-handler` provides a complete plugin architecture with:

- **Database-Backed Storage**: Plugins stored as code in SQLite
- **Dynamic Loading**: Runtime plugin loading from temporary files
- **Route Management**: Plugin-defined API routes with action chaining
- **Event Hooks**: Plugin lifecycle and Docker event integration
- **Table Creation**: Automatic database table creation for plugin data
- **Server-Side Hooks**: Plugin access to database and logger utilities
- **Manifest Support**: Install from JSON/YAML manifests
- **Type-Safe Plugin Builder**: Build plugins with full TypeScript support

## Installation

```bash
bun add @dockstat/plugin-handler
```

## Exports

The package provides multiple entry points:

```typescript
// Main plugin handler
import PluginHandler from "@dockstat/plugin-handler"

// Plugin builder utilities (for plugin developers)
import { definePlugin, pluginBuilder, createActions } from "@dockstat/plugin-handler/builder"
```

## Quick Start

### Using the Plugin Handler

```typescript
import DB from "@dockstat/sqlite-wrapper"
import PluginHandler from "@dockstat/plugin-handler"

const db = new DB("./app.db")
const pluginHandler = new PluginHandler(db)

// Load all plugins from database
await pluginHandler.loadAllPlugins()

// Get plugin status
const status = pluginHandler.getStatus()
console.log(status)
```

### Building Plugins with Type Safety

```typescript
import { definePlugin, createActions } from "@dockstat/plugin-handler/builder"
import { column } from "@dockstat/sqlite-wrapper"

// Define your table schema type
interface MyPluginData {
  id: number
  name: string
  settings: Record<string, unknown>
}

// Create type-safe actions
const actions = createActions<MyPluginData>({
  getData: async ({ table, logger }) => {
    logger.info("Fetching data")
    return table?.select(["*"]).all() ?? []
  },
  saveData: async ({ table, body, logger }) => {
    logger.info("Saving data")
    const result = table?.insert(body as MyPluginData)
    return { success: true, id: result?.lastInsertRowid }
  },
})

// Define the complete plugin with full type safety
export default definePlugin<MyPluginData, typeof actions>({
  name: "my-plugin",
  description: "A sample plugin",
  version: "1.0.0",
  repository: "https://github.com/user/my-plugin",
  repoType: "github",
  manifest: "https://github.com/user/my-plugin/manifest.json",
  author: { name: "Developer", email: "dev@example.com" },
  tags: ["sample", "demo"],

  config: {
    table: {
      name: "my_plugin_data",
      columns: {
        id: column.id(),
        name: column.text({ notNull: true }),
        settings: column.json(),
      },
      parser: { JSON: ["settings"] },
    },
    actions,
    apiRoutes: {
      "/data": { method: "GET", actions: ["getData"] },
      "/save": { method: "POST", actions: ["saveData"] },
    },
  },

  events: {
    onContainerStart: async (container, { logger }) => {
      logger.info(`Container started: ${container.id}`)
    },
  },
})
```

## Plugin Builder API

The `@dockstat/plugin-handler/builder` export provides type-safe utilities for building plugins.

### `definePlugin<T, A>(definition)`

The primary function for defining a complete plugin with full type safety.

```typescript
import { definePlugin } from "@dockstat/plugin-handler/builder"

export default definePlugin({
  name: "example-plugin",
  description: "An example plugin",
  version: "1.0.0",
  repository: "https://github.com/user/example-plugin",
  repoType: "github",
  manifest: "https://github.com/user/example-plugin/manifest.json",
  author: { name: "Developer" },
  config: {
    // ... configuration
  },
})
```

### `createActions<T>(actions)`

Create type-safe action handlers for your plugin.

```typescript
import { createActions } from "@dockstat/plugin-handler/builder"

interface MyDataBaseType {
  id: number
  value: string
}

const actions = createActions<MyDataBaseType>({
  fetchAll: async ({ table, logger }) => {
    logger.debug("Fetching all records")
    return table?.select(["*"]).all() ?? []
  },
  create: async ({ table, body, logger }) => {
    logger.info("Creating record")
    return table?.insert(body as MyDataBaseType)
  },
})
```

### `createAction<T, TBody, TReturn>(handler)`

Create a single type-safe action handler.

```typescript
import { createAction } from "@dockstat/plugin-handler/builder"

const myAction = createAction<MyData, { name: string }, { success: boolean }>(
  async ({ table, body, logger }) => {
    logger.info(`Processing: ${body?.name}`)
    return { success: true }
  }
)
```

### `createRoute<T, A, K>(route)`

Create a type-safe API route configuration.

```typescript
import { createRoute } from "@dockstat/plugin-handler/builder"

const route = createRoute<MyData, typeof actions, "fetchAll" | "create">({
  method: "POST",
  actions: ["fetchAll", "create"],
})
```

### `createApiRoutes<T, A>(routes)`

Create a type-safe routes object.

```typescript
import { createApiRoutes } from "@dockstat/plugin-handler/builder"

const routes = createApiRoutes<MyData, typeof actions>({
  "/list": { method: "GET", actions: ["fetchAll"] },
  "/create": { method: "POST", actions: ["create"] },
})
```

### `createTable<T>(config)`

Create a type-safe table configuration.

```typescript
import { createTable } from "@dockstat/plugin-handler/builder"
import { column } from "@dockstat/sqlite-wrapper"

const table = createTable<MyData>({
  name: "my_data",
  columns: {
    id: column.id(),
    value: column.text({ notNull: true }),
  },
  parser: { JSON: [] },
})
```

### `createEvents<T>(events)`

Create type-safe event handlers.

```typescript
import { createEvents } from "@dockstat/plugin-handler/builder"

const events = createEvents<MyData>({
  onContainerStart: async (container, { logger, table }) => {
    logger.info(`Container ${container.id} started`)
  },
  onContainerStop: async (container, { logger }) => {
    logger.info(`Container ${container.id} stopped`)
  },
})
```

### `createFrontendConfig(config)`

Create frontend configuration for plugin UI.

```typescript
import {
  createFrontendConfig,
  createFrontendRoute,
  createFrontendLoader,
  createFrontendAction,
} from "@dockstat/plugin-handler/builder"

const frontend = createFrontendConfig({
  routes: [
    createFrontendRoute({
      path: "/dashboard",
      template: { type: "container", children: [] },
      meta: { title: "Dashboard", showInNav: true },
      loaders: [
        createFrontendLoader({
          id: "data-loader",
          apiRoute: "/data",
          stateKey: "data",
        }),
      ],
      actions: [
        createFrontendAction({
          id: "refresh",
          type: "reload",
          loaderIds: ["data-loader"],
        }),
      ],
    }),
  ],
})
```

### `pluginBuilder<T, A>()`

Fluent builder API for constructing plugins step-by-step.

```typescript
import { pluginBuilder } from "@dockstat/plugin-handler/builder"

const plugin = pluginBuilder<MyData, typeof actions>()
  .name("my-plugin")
  .description("A plugin built with the fluent API")
  .version("1.0.0")
  .repository("https://github.com/user/my-plugin", "github")
  .manifest("https://github.com/user/my-plugin/manifest.json")
  .author({ name: "Developer", email: "dev@example.com" })
  .tags(["example", "demo"])
  .table({
    name: "my_data",
    columns: { id: column.id(), value: column.text() },
    parser: { JSON: [] },
  })
  .actions(actions)
  .apiRoutes({
    "/data": { method: "GET", actions: ["fetchAll"] },
  })
  .events({
    onContainerStart: async (container, { logger }) => {
      logger.info("Container started")
    },
  })
  .build()
```

## Type Exports

The builder also re-exports useful types:

```typescript
import type {
  PluginActions,
  PluginActionContext,
  PluginConfig,
  PluginRoute,
  PluginFrontendConfig,
  PluginFrontendRoute,
  FrontendAction,
  FrontendLoader,
  EVENTS,
  ColumnDefinition,
  PluginDefinition,
  PluginMeta,
  PluginAuthor,
  TableConfig,
  ActionHandler,
} from "@dockstat/plugin-handler/builder"
```

## Plugin Handler API

### Constructor

```typescript
new PluginHandler(db: DB, loggerParents?: string[])
```

### Plugin Management

- `savePlugin(plugin, update?)` - Save or update a plugin
- `deletePlugin(id)` - Delete a plugin
- `getAll()` - Get all plugins (without code)
- `getStatus()` - Get plugin system status

### Loading & Unloading

- `loadAllPlugins()` - Load all plugins from database
- `loadPlugins(ids)` - Load specific plugins by ID
- `loadPlugin(id)` - Load a single plugin
- `unloadPlugin(id)` - Unload a plugin
- `unloadAllPlugins()` - Unload all plugins
- `getLoadedPlugins()` - Get loaded plugin IDs

### Route Handling

- `handleRoute(id, path, request)` - Execute a plugin route
- `getAllPluginRoutes()` - Get all available routes

### Frontend

- `getAllFrontendRoutes()` - Get all frontend routes
- `getFrontendRoute(id, path)` - Get specific frontend route
- `getFrontendTemplate(id, path)` - Get route template
- `hasFrontendRoutes(id)` - Check if plugin has frontend

### Event System

- `getHookHandlers()` - Get all event hooks from loaded plugins
- `getServerHooks(id)` - Get database/logger for a plugin

### Installation

- `installFromManifestLink(url)` - Install from manifest URL

## Related Packages

- `@dockstat/sqlite-wrapper` - Database layer for plugin storage
- `@dockstat/logger` - Logging system provided to plugins
- `@dockstat/typings` - TypeScript types for plugin interfaces

## License

Part of the DockStat project. See main repository for license information.
