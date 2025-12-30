---
id: eadaaa93-6c65-4207-a4ac-9b19afc8f2a5
title: "@dockstat/plugin-handler"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: bbcefaa2-6bd4-46e8-ae4b-a6b823593e67
updatedAt: 2025-12-16T19:04:24.453Z
urlId: pXHTTOpluB
---

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
import PluginHandler from "@dockstat/plugin-handler";

// Plugin builder utilities (for plugin developers)
import {
  definePlugin,
  pluginBuilder,
  createActions,
} from "@dockstat/plugin-handler/builder";
```

## Quick Start

```typescript
import DB from "@dockstat/sqlite-wrapper";
import PluginHandler from "@dockstat/plugin-handler";

const db = new DB("./app.db");
const pluginHandler = new PluginHandler(db);

// Load all plugins from database
await pluginHandler.loadAllPlugins();

// Get plugin status
const status = pluginHandler.getStatus();
console.log(status);
```

## Architecture

### Data Flow

```mermaidjs
graph LR
    A["Plugin Source<br/>(Manifest URL)"]
    A --> B["installFrom<br/>ManifestLink()"]
    B --> C["(SQLite Database<br/>plugins table)"]
    C --> D["loadPlugin()<br/>Write to /tmp"]
    D --> E[Dynamic Import<br/>Cache in Map]
    E --> F[Plugin Routes &<br/>Event Hooks]
```

## Plugin Builder API

The `@dockstat/plugin-handler/builder` export provides type-safe utilities for building plugins with full TypeScript support.

### `definePlugin<T, A>(definition)`

The primary function for defining a complete plugin with full type safety. This is the recommended way to create plugins.

```typescript
import { definePlugin, createActions } from "@dockstat/plugin-handler/builder";
import { column } from "@dockstat/sqlite-wrapper";

// Define your table schema type
interface MyPluginData {
  id: number;
  name: string;
  settings: Record<string, unknown>;
}

// Create type-safe actions
const actions = createActions<MyPluginData>({
  getData: async ({ table, logger }) => {
    logger.info("Fetching data");
    return table?.select(["*"]).all() ?? [];
  },
  saveData: async ({ table, body, logger }) => {
    logger.info("Saving data");
    const result = table?.insert(body as MyPluginData);
    return { success: true, id: result?.lastInsertRowid };
  },
});

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
      logger.info(`Container started: ${container.id}`);
    },
  },
});
```

### `createActions<T>(actions)`

Create type-safe action handlers for your plugin. The generic type `T` represents your table schema.

```typescript
import { createActions } from "@dockstat/plugin-handler/builder";

interface MyData {
  id: number;
  value: string;
}

const actions = createActions<MyData>({
  fetchAll: async ({ table, logger }) => {
    logger.debug("Fetching all records");
    return table?.select(["*"]).all() ?? [];
  },
  create: async ({ table, body, logger }) => {
    logger.info("Creating record");
    return table?.insert(body as MyData);
  },
  update: async ({ table, body, previousAction }) => {
    // Actions can access results from previous actions in the chain
    return table
      ?.update(body as Partial<MyData>)
      .where("id", "=", body.id)
      .run();
  },
});
```

### `createAction<T, TBody, TReturn>(handler)`

Create a single type-safe action handler with explicit body and return types.

```typescript
import { createAction } from "@dockstat/plugin-handler/builder";

interface CreateUserBody {
  name: string;
  email: string;
}

interface CreateUserResult {
  success: boolean;
  userId?: number;
}

const createUser = createAction<MyData, CreateUserBody, CreateUserResult>(
  async ({ table, body, logger }) => {
    logger.info(`Creating user: ${body?.name}`);
    const result = table?.insert({ ...body, id: 0 } as MyData);
    return { success: true, userId: result?.lastInsertRowid };
  },
);
```

### `createRoute<T, A, K>(route)`

Create a type-safe API route configuration with action validation.

```typescript
import { createRoute } from "@dockstat/plugin-handler/builder";

// TypeScript will ensure only valid action names can be used
const route = createRoute<MyData, typeof actions, "fetchAll" | "create">({
  method: "POST",
  actions: ["fetchAll", "create"],
});
```

### `createApiRoutes<T, A>(routes)`

Create a type-safe routes object for all your plugin endpoints.

```typescript
import { createApiRoutes } from "@dockstat/plugin-handler/builder";

const routes = createApiRoutes<MyData, typeof actions>({
  "/list": { method: "GET", actions: ["fetchAll"] },
  "/create": { method: "POST", actions: ["validate", "create", "notify"] },
  "/update/:id": { method: "POST", actions: ["validate", "update"] },
});
```

### `createTable<T>(config)`

Create a type-safe table configuration for your plugin's database table.

```typescript
import { createTable } from "@dockstat/plugin-handler/builder";
import { column } from "@dockstat/sqlite-wrapper";

interface UserData {
  id: number;
  username: string;
  email: string;
  preferences: Record<string, unknown>;
  createdAt: number;
}

const table = createTable<UserData>({
  name: "plugin_users",
  columns: {
    id: column.id(),
    username: column.text({ notNull: true, unique: true }),
    email: column.text({ notNull: true }),
    preferences: column.json(),
    createdAt: column.createdAt(),
  },
  parser: { JSON: ["preferences"] },
});
```

### `createEvents<T>(events)`

Create type-safe event handlers for Docker and server events.

```typescript
import { createEvents } from "@dockstat/plugin-handler/builder";

const events = createEvents<MyData>({
  onContainerStart: async (container, { logger, table }) => {
    logger.info(`Container ${container.id} started`);
    await table?.insert({ event: "start", containerId: container.id });
  },
  onContainerStop: async (container, { logger }) => {
    logger.info(`Container ${container.id} stopped`);
  },
  onContainerRestart: async (container, { logger }) => {
    logger.warn(`Container ${container.id} restarted`);
  },
  onServerBoot: async () => {
    console.log("Plugin initialized on server boot");
  },
});
```

### Frontend Configuration Helpers

Create frontend UI configuration for your plugin.

```typescript
import {
  createFrontendConfig,
  createFrontendRoute,
  createFrontendLoader,
  createFrontendAction,
} from "@dockstat/plugin-handler/builder";

const frontend = createFrontendConfig({
  routes: [
    createFrontendRoute({
      path: "/dashboard",
      template: {
        type: "container",
        children: [
          { type: "heading", props: { level: 1, text: "Plugin Dashboard" } },
          { type: "dataTable", props: { dataKey: "items" } },
        ],
      },
      meta: {
        title: "Dashboard",
        icon: "dashboard",
        showInNav: true,
        navOrder: 1,
      },
      loaders: [
        createFrontendLoader({
          id: "items-loader",
          apiRoute: "/data",
          method: "GET",
          stateKey: "items",
          polling: { interval: 30000, enabled: true },
        }),
      ],
      actions: [
        createFrontendAction({
          id: "refresh",
          type: "reload",
          loaderIds: ["items-loader"],
        }),
        createFrontendAction({
          id: "create-item",
          type: "api",
          apiRoute: "/create",
          method: "POST",
          onSuccess: {
            notify: { message: "Item created!", type: "success" },
            triggerAction: "refresh",
          },
        }),
      ],
    }),
  ],
  globalState: {
    initial: { theme: "light" },
    computed: { isDark: "state.theme === 'dark'" },
  },
});
```

### `pluginBuilder<T, A>()`

Fluent builder API for constructing plugins step-by-step. Useful when you want to build plugins programmatically.

```typescript
import { pluginBuilder } from "@dockstat/plugin-handler/builder";
import { column } from "@dockstat/sqlite-wrapper";

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
    columns: {
      id: column.id(),
      value: column.text({ notNull: true }),
    },
    parser: { JSON: [] },
  })
  .actions(actions)
  .apiRoutes({
    "/data": { method: "GET", actions: ["fetchAll"] },
    "/create": { method: "POST", actions: ["create"] },
  })
  .frontend({
    routes: [{ path: "/", template: {} }],
  })
  .events({
    onContainerStart: async (container, { logger }) => {
      logger.info("Container started");
    },
  })
  .init(() => {
    console.log("Plugin initialized");
  })
  .build();

export default plugin;
```

### Type Exports

The builder re-exports useful types for plugin development:

```typescript
import type {
  // Core plugin types
  PluginDefinition,
  PluginMeta,
  PluginAuthor,
  PluginConfig,
  PluginActions,
  PluginActionContext,
  PluginRoute,
  TableConfig,
  ActionHandler,

  // Frontend types
  PluginFrontendConfig,
  PluginFrontendRoute,
  FrontendAction,
  FrontendLoader,

  // Event types
  EVENTS,

  // Database types
  ColumnDefinition,
} from "@dockstat/plugin-handler/builder";
```

## Core Concepts

### Plugin Structure

A DockStat plugin is a JavaScript module with specific exports:

```typescript
export default {
  id: 1, // Set automatically by handler
  name: "example-plugin",
  version: "1.0.0",

  config: {
    // Database table for plugin data
    table: {
      name: "plugin_data",
      columns: {
        id: column.id(),
        data: column.json(),
      },
      jsonColumns: ["data"],
    },

    // API routes exposed by plugin
    apiRoutes: {
      "/status": {
        method: "GET",
        actions: ["getStatus"],
      },
      "/save": {
        method: "POST",
        actions: ["validateData", "saveData"],
      },
    },

    // Actions that routes can call
    actions: {
      getStatus: ({ table, logger }) => {
        return table.select(["*"]).all();
      },
      validateData: ({ body, logger }) => {
        logger.debug("Validating data");
        return { valid: true, data: body };
      },
      saveData: ({ table, previousAction, logger }) => {
        if (previousAction.valid) {
          table.insert(previousAction.data);
          return { success: true };
        }
        return { success: false };
      },
    },
  },

  // Event hooks for Docker events
  events: {
    onContainerStart: async ({ container, logger }) => {
      logger.info(`Container started: ${container.id}`);
    },
    onContainerStop: async ({ container, logger }) => {
      logger.info(`Container stopped: ${container.id}`);
    },
  },
};
```

### Plugin Database Schema

Plugins are stored in the `plugins` table:

```typescript
interface DBPluginSchema {
  id: number;
  repoType: "github" | "gitlab" | "local" | "default";
  name: string;
  description?: string;
  tags?: string[];
  version: string;
  repository: string;
  manifest: string;
  author: object;
  plugin: string; // The actual plugin code
}
```

## API Reference

### Constructor

```typescript
new PluginHandler(db: DB, loggerParents?: string[])
```

Create a new plugin handler instance.

**Parameters:**

- `db` - SQLite database instance from `@dockstat/sqlite-wrapper`
- `loggerParents` - Optional parent logger names for hierarchical logging

**Example:**

```typescript
const db = new DB("./dockstat.db");
const handler = new PluginHandler(db, ["API"]);
```

### Plugin Management

#### `savePlugin(plugin: DBPluginSchema, update?: boolean)`

Save or update a plugin in the database.

```typescript
const result = handler.savePlugin(
  {
    name: "my-plugin",
    version: "1.0.0",
    repository: "https://github.com/user/plugin",
    manifest: "https://github.com/user/plugin/manifest.json",
    author: { name: "Developer", email: "dev@example.com" },
    tags: ["monitoring", "alerts"],
    repoType: "github",
    plugin: pluginCode,
  },
  false,
);

// result: { success: true, id: 5, message: "Plugin saved successfully" }
```

**Update Mode:**

```typescript
handler.savePlugin(updatedPlugin, true);
// Unloads, deletes, and re-saves the plugin
```

#### `deletePlugin(id: number)`

Delete a plugin from the database.

```typescript
handler.deletePlugin(5);
// Returns: { success: true, message: "Deleted Plugin" }
```

#### `getAll()`

Get all plugins from database (without plugin code).

```typescript
const plugins = handler.getAll();
// Returns array of plugin metadata
```

#### `getStatus()`

Get comprehensive plugin system status.

```typescript
const status = handler.getStatus();
```

**Returns:**

```typescript
{
  installed_plugins: {
    count: 3,
    data: [/* plugin metadata */]
  },
  repos: ["https://github.com/user/plugin1", "local"],
  loaded_plugins: [/* currently loaded plugin data */]
}
```

### Loading & Unloading

#### `loadAllPlugins()`

Load all plugins from database into memory.

```typescript
await handler.loadAllPlugins();
```

**Process:**

1. Fetch all plugins from database
2. Filter out already-loaded plugins
3. Write each plugin to temporary file
4. Dynamically import the module
5. Create plugin database tables if defined
6. Cache in memory map

#### `loadPlugins(ids: number[])`

Load specific plugins by ID.

```typescript
const result = await handler.loadPlugins([1, 2, 3]);
```

**Returns:**

```typescript
{
  successes: [1, 3],
  errors: [
    { pluginId: 2, error: "Could not load 2 - Module not found" }
  ]
}
```

#### `loadPlugin(id: number)`

Load a single plugin.

```typescript
const plugin = await handler.loadPlugin(5);
```

#### `unloadPlugin(id: number)`

Unload a specific plugin from memory.

```typescript
handler.unloadPlugin(5);
```

#### `unloadAllPlugins()`

Unload all plugins from memory.

```typescript
handler.unloadAllPlugins();
```

#### `getLoadedPlugins()`

Get array of loaded plugin IDs.

```typescript
const loaded = handler.getLoadedPlugins();
// Returns: [1, 3, 5]
```

### Route Handling

#### `handleRoute(id: number, path: string, request: Request)`

Execute a plugin's API route.

```typescript
const response = await handler.handleRoute(5, "/status", request);
```

**Process:**

1. Find loaded plugin by ID
2. Lookup route in plugin's `apiRoutes`
3. Execute action chain sequentially
4. Pass `previousAction` result to next action
5. Return final action result

**Example Plugin Route:**

```typescript
config: {
  apiRoutes: {
    "/process": {
      method: "POST",
      actions: ["validate", "transform", "save"]
    }
  },
  actions: {
    validate: ({ body }) => ({ valid: true, data: body }),
    transform: ({ previousAction }) => ({
      ...previousAction,
      data: previousAction.data.toUpperCase()
    }),
    save: ({ table, previousAction }) => {
      table.insert(previousAction.data)
      return { success: true }
    }
  }
}
```

#### `getAllPluginRoutes()`

Get all available routes from loaded plugins.

```typescript
const routes = handler.getAllPluginRoutes();
```

**Returns:**

```typescript
[
  {
    plugin: "example-plugin",
    routes: ["/status", "/data", "/settings"],
  },
  {
    plugin: "another-plugin",
    routes: ["/info"],
  },
];
```

### Event System

#### `getHookHandlers()`

Get all event hooks from loaded plugins.

```typescript
const hooks = handler.getHookHandlers();
```

**Returns:** `Map<number, Partial<EVENTS>>`

Map of plugin IDs to their event handlers.

**Event Types:**

```typescript
interface EVENTS {
  onContainerStart?: (context: EventContext) => Promise<void>;
  onContainerStop?: (context: EventContext) => Promise<void>;
  onContainerRestart?: (context: EventContext) => Promise<void>;
  onImagePull?: (context: EventContext) => Promise<void>;
  onImageRemove?: (context: EventContext) => Promise<void>;
  // ... more events
}
```

### Installation

#### `installFromManifestLink(url: string)`

Install a plugin from a manifest URL.

```typescript
await handler.installFromManifestLink(
  "https://example.com/plugin/manifest.json",
);
```

**Supported Formats:**

- JSON (`.json`)
- YAML (`.yml`, `.yaml`)

**Manifest Example:**

```json
{
  "name": "notification-plugin",
  "version": "1.0.0",
  "description": "Send notifications on events",
  "repository": "https://github.com/user/notification-plugin",
  "manifest": "https://github.com/user/notification-plugin/manifest.json",
  "author": {
    "name": "Developer",
    "email": "dev@example.com"
  },
  "tags": ["notifications", "alerts"],
  "repoType": "github",
  "plugin": "export default { ... }"
}
```

### Server Hooks

#### `getServerHooks(id: number)`

Get database table and logger for a plugin (used internally).

```typescript
const hooks = handler.getServerHooks(5);
// Returns: { table: QueryBuilder, logger: Logger }
```

### Database Access

#### `getTable()`

Get the underlying `plugins` table QueryBuilder.

```typescript
const table = handler.getTable();
const count = table.count();
```

### Frontend Methods

#### `getAllFrontendRoutes()`

Get all frontend routes from all loaded plugins.

```typescript
const routes = handler.getAllFrontendRoutes();
```

#### `getFrontendRoute(id: number, path: string)`

Get a specific frontend route from a plugin.

```typescript
const route = handler.getFrontendRoute(5, "/dashboard");
```

#### `getFrontendTemplate(id: number, path: string)`

Get the template for a frontend route.

```typescript
const template = handler.getFrontendTemplate(5, "/dashboard");
```

#### `hasFrontendRoutes(id: number)`

Check if a plugin has any frontend routes.

```typescript
if (handler.hasFrontendRoutes(5)) {
  // Plugin has UI
}
```

#### `getFrontendNavigationItems()`

Get navigation items for all plugins with frontend routes.

```typescript
const navItems = handler.getFrontendNavigationItems();
```

## Usage Patterns

### Basic Plugin System Setup

```typescript
import { Elysia } from "elysia";
import DB from "@dockstat/sqlite-wrapper";
import PluginHandler from "@dockstat/plugin-handler";

const db = new DB("./dockstat.db");
const plugins = new PluginHandler(db);

await plugins.loadAllPlugins();

new Elysia()
  .get("/plugins", () => plugins.getStatus())
  .get("/plugins/routes", () => plugins.getAllPluginRoutes())
  .all("/plugins/:id/routes/*", async ({ params, request }) => {
    const path = new URL(request.url).pathname.replace(
      `/plugins/${params.id}/routes`,
      "",
    );

    return plugins.handleRoute(Number(params.id), path, request);
  })
  .listen(3000);
```

### Installing Plugins from GitHub

```typescript
// Install from GitHub manifest
await plugins.installFromManifestLink(
  "https://raw.githubusercontent.com/user/plugin/main/manifest.json",
);

// Load the new plugin
const status = plugins.getStatus();
const newPlugin = status.installed_plugins.data.at(-1);
await plugins.loadPlugin(newPlugin.id);
```

### Plugin Lifecycle Management

```typescript
class PluginManager {
  private handler: PluginHandler;

  async installAndActivate(manifestUrl: string) {
    // Install from manifest
    const result = await this.handler.installFromManifestLink(manifestUrl);

    if (!result.success) {
      throw new Error(result.message);
    }

    // Load into memory
    await this.handler.loadPlugin(result.id);

    // Verify loaded
    const loaded = this.handler.getLoadedPlugins();
    return loaded.includes(result.id);
  }

  async deactivate(id: number) {
    this.handler.unloadPlugin(id);
  }

  async uninstall(id: number) {
    this.handler.unloadPlugin(id);
    this.handler.deletePlugin(id);
  }

  async update(id: number, newManifestUrl: string) {
    // Fetch new version
    const res = await fetch(newManifestUrl);
    const manifest = await res.json();

    // Update in database
    await this.handler.savePlugin(
      { ...manifest, id },
      true, // update mode
    );
  }
}
```

### Docker Event Integration

```typescript
import { DockerEventEmitter } from "@dockstat/docker-client";

const eventEmitter = new DockerEventEmitter();
const plugins = new PluginHandler(db);

await plugins.loadAllPlugins();

eventEmitter.on("container:start", async (container) => {
  const hooks = plugins.getHookHandlers();

  for (const [pluginId, events] of hooks) {
    if (events.onContainerStart) {
      const serverHooks = plugins.getServerHooks(pluginId);

      await events.onContainerStart({
        container,
        logger: serverHooks.logger,
        table: serverHooks.table,
      });
    }
  }
});
```

### Multi-Action Routes

```typescript
import { definePlugin, createActions } from "@dockstat/plugin-handler/builder"

const actions = createActions({
  parseInput: ({ body, logger }) => {
    logger.debug("Parsing input")
    try {
      return { success: true, data: JSON.parse(body) }
    } catch {
      return { success: false, error: "Invalid JSON" }
    }
  },

  validateSchema: ({ previousAction, logger }) => {
    if (!previousAction.success) return previousAction
    const valid = /* schema validation */
    return { ...previousAction, valid }
  },

  transformData: ({ previousAction }) => {
    if (!previousAction.valid) return previousAction
    const transformed = /* transform logic */
    return { ...previousAction, data: transformed }
  },

  saveToDatabase: ({ table, previousAction }) => {
    if (!previousAction.valid) return previousAction
    const result = table.insert(previousAction.data)
    return { ...previousAction, insertId: result.insertId }
  },

  sendNotification: ({ previousAction, logger }) => {
    if (!previousAction.valid) return previousAction
    logger.info(`Data saved with ID: ${previousAction.insertId}`)
    return { success: true, id: previousAction.insertId }
  }
})

export default definePlugin({
  name: "data-processor",
  // ... other metadata
  config: {
    apiRoutes: {
      "/process": {
        method: "POST",
        actions: [
          "parseInput",
          "validateSchema",
          "transformData",
          "saveToDatabase",
          "sendNotification"
        ]
      }
    },
    actions
  }
})
```

## Plugin Development Guide

### Creating a Plugin with the Builder

1. **Set up your project**

```bash
mkdir my-dockstat-plugin
cd my-dockstat-plugin
bun init
bun add @dockstat/plugin-handler @dockstat/sqlite-wrapper
```

2. **Create your plugin**

```typescript
// src/index.ts
import {
  definePlugin,
  createActions,
  createTable,
} from "@dockstat/plugin-handler/builder";
import { column } from "@dockstat/sqlite-wrapper";

// Define your data schema
interface PluginData {
  id: number;
  value: string;
  metadata: Record<string, unknown>;
}

// Create actions with full type safety
const actions = createActions<PluginData>({
  getData: async ({ table, logger }) => {
    logger.debug("Fetching data");
    return table?.select(["*"]).all() ?? [];
  },
  saveData: async ({ table, body, logger }) => {
    logger.info("Saving data");
    return table?.insert(body as PluginData);
  },
});

// Define the plugin
export default definePlugin<PluginData, typeof actions>({
  name: "my-plugin",
  description: "My awesome DockStat plugin",
  version: "1.0.0",
  repository: "https://github.com/user/my-plugin",
  repoType: "github",
  manifest: "https://github.com/user/my-plugin/manifest.json",
  author: {
    name: "Your Name",
    email: "you@example.com",
  },
  tags: ["monitoring"],

  config: {
    table: {
      name: "my_plugin_data",
      columns: {
        id: column.id(),
        value: column.text({ notNull: true }),
        metadata: column.json(),
      },
      parser: { JSON: ["metadata"] },
    },
    actions,
    apiRoutes: {
      "/data": { method: "GET", actions: ["getData"] },
      "/save": { method: "POST", actions: ["saveData"] },
    },
  },

  events: {
    onContainerStart: async (container, { logger }) => {
      logger.info(`Container ${container.id} started`);
    },
  },
});
```

3. **Create a manifest file**

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My awesome DockStat plugin",
  "repository": "https://github.com/user/my-plugin",
  "manifest": "https://github.com/user/my-plugin/manifest.json",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "tags": ["monitoring"],
  "repoType": "github",
  "plugin": "/* bundled plugin code */"
}
```

### Action Context

Actions receive a context object with these properties:

```typescript
interface ActionContext<T, K = unknown> {
  table: QueryBuilder<T> | null; // Plugin's database table (if configured)
  body: K | undefined; // Request body (POST/PUT only)
  logger: {
    error: (msg: string) => void;
    warn: (msg: string) => void;
    info: (msg: string) => void;
    debug: (msg: string) => void;
  };
  previousAction: unknown; // Result from previous action in chain
}
```

### Event Context

Event handlers receive the event data and a context object:

```typescript
// Event handler signature
onContainerStart: async (
  container: ContainerInfo,
  context: {
    logger: Logger;
    table: QueryBuilder<T>;
  },
) => {
  // Handle event
};
```

## Security Considerations

1. **Code Execution**: Plugins execute arbitrary code - only install trusted plugins
2. **Database Access**: Plugins have full access to their tables
3. **Temporary Files**: Plugin code is written to `/tmp` - ensure proper permissions
4. **Manifest Sources**: Validate manifest URLs before installation
5. **Action Chain**: Each action has access to previous results

## Performance

- **Lazy Loading**: Plugins only loaded when needed
- **Memory Caching**: Loaded plugins cached in Map
- **Temporary Files**: Cleaned up after import
- **Database Tables**: Created once, reused across restarts
- **Action Chaining**: Synchronous by default for performance

## Troubleshooting

### Plugin Won't Load

```typescript
// Check if plugin exists in database
const plugins = handler.getAll();
console.log(plugins);

// Check for errors
try {
  await handler.loadPlugin(5);
} catch (err) {
  console.error("Load error:", err);
}
```

### Route Not Found

```typescript
// List
```
