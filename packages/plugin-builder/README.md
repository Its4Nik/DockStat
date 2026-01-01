# @dockstat/plugin-builder

> Type-safe plugin builder utilities for creating DockStat plugins with full TypeScript support.

## Overview

`@dockstat/plugin-builder` provides a lightweight, type-safe API for building DockStat plugins. It includes:

- **Type-Safe Plugin Definition**: Full TypeScript inference for plugin configuration
- **Builder Pattern**: Fluent API for constructing plugins step-by-step
- **Helper Functions**: Utilities for creating actions, routes, events, and frontend config
- **Zero Runtime Dependencies**: Types are bundled - no need to install internal packages

## Installation

```bash
# npm
npm install @dockstat/plugin-builder

# bun
bun add @dockstat/plugin-builder

# pnpm
pnpm add @dockstat/plugin-builder
```

## Quick Start

```typescript
import { definePlugin, createActions } from "@dockstat/plugin-builder";

// Define your table schema type
interface MyPluginData {
  id: number;
  name: string;
  config: Record<string, unknown>;
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

// Define the complete plugin
export default definePlugin<MyPluginData, typeof actions>({
  name: "my-plugin",
  description: "A sample DockStat plugin",
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
        id: { type: "INTEGER", primaryKey: true, autoincrement: true },
        name: { type: "TEXT", notNull: true },
        config: { type: "JSON" },
      },
      parser: { JSON: ["config"] },
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

## API Reference

### `definePlugin<T, A>(definition)`

The primary function for defining a complete plugin with full type safety.

```typescript
import { definePlugin } from "@dockstat/plugin-builder";

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
});
```

### `createActions<T>(actions)`

Create type-safe action handlers for your plugin.

```typescript
import { createActions } from "@dockstat/plugin-builder";

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
});
```

### `createAction<T, TBody, TReturn>(handler)`

Create a single type-safe action handler with explicit body and return types.

```typescript
import { createAction } from "@dockstat/plugin-builder";

const myAction = createAction<MyData, { name: string }, { success: boolean }>(
  async ({ table, body, logger }) => {
    logger.info(`Processing: ${body?.name}`);
    return { success: true };
  }
);
```

### `createRoute<T, A, K>(route)`

Create a type-safe API route configuration.

```typescript
import { createRoute } from "@dockstat/plugin-builder";

const route = createRoute<MyData, typeof actions, "fetchAll" | "create">({
  method: "POST",
  actions: ["fetchAll", "create"],
});
```

### `createApiRoutes<T, A>(routes)`

Create a type-safe routes object.

```typescript
import { createApiRoutes } from "@dockstat/plugin-builder";

const routes = createApiRoutes<MyData, typeof actions>({
  "/list": { method: "GET", actions: ["fetchAll"] },
  "/create": { method: "POST", actions: ["create"] },
});
```

### `createTable<T>(config)`

Create a type-safe table configuration.

```typescript
import { createTable } from "@dockstat/plugin-builder";

const table = createTable<MyData>({
  name: "my_data",
  columns: {
    id: { type: "INTEGER", primaryKey: true, autoincrement: true },
    value: { type: "TEXT", notNull: true },
  },
  parser: { JSON: [] },
});
```

### `createEvents<T>(events)`

Create type-safe event handlers.

```typescript
import { createEvents } from "@dockstat/plugin-builder";

const events = createEvents<MyData>({
  onContainerStart: async (container, { logger, table }) => {
    logger.info(`Container ${container.id} started`);
  },
  onContainerStop: async (container, { logger }) => {
    logger.info(`Container ${container.id} stopped`);
  },
});
```

### Frontend Configuration Helpers

```typescript
import {
  createFrontendConfig,
  createFrontendRoute,
  createFrontendLoader,
  createFrontendAction,
} from "@dockstat/plugin-builder";

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
});
```

### `pluginBuilder<T, A>()`

Fluent builder API for constructing plugins step-by-step.

```typescript
import { pluginBuilder } from "@dockstat/plugin-builder";

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
    columns: { id: { type: "INTEGER" }, value: { type: "TEXT" } },
    parser: { JSON: [] },
  })
  .actions(actions)
  .apiRoutes({
    "/data": { method: "GET", actions: ["fetchAll"] },
  })
  .events({
    onContainerStart: async (container, { logger }) => {
      logger.info("Container started");
    },
  })
  .build();

export default plugin;
```

## Type Exports

The package exports all necessary types for plugin development:

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
  BuiltPlugin,

  // Frontend types
  PluginFrontendConfig,
  PluginFrontendRoute,
  FrontendAction,
  FrontendLoader,

  // Event types
  EVENTS,

  // Database types
  ColumnDefinition,

  // Utility types
  InferTableSchema,
  ActionNames,
  ValidateRouteActions,
} from "@dockstat/plugin-builder";
```

## Plugin Structure

A DockStat plugin consists of:

### Metadata

- `name` - Unique plugin identifier
- `description` - Short description
- `version` - Semver version string
- `repository` - Repository URL
- `repoType` - One of: `"github"`, `"gitlab"`, `"local"`, `"default"`
- `manifest` - URL to the plugin manifest
- `author` - Author information (name, email, website)
- `tags` - Array of tags for categorization

### Configuration (`config`)

- `table` - Database table configuration (optional)
- `actions` - Action handlers for API routes
- `apiRoutes` - API endpoint definitions
- `frontend` - Frontend UI configuration (optional)

### Events (`events`)

Docker and server lifecycle event handlers:

- `onContainerStart`
- `onContainerStop`
- `onContainerRestart`
- `onImagePull`
- `onImageRemove`
- `onServerBoot`
- And more...

## Action Context

Actions receive a context object with:

```typescript
interface ActionContext<T, K = unknown> {
  table: QueryBuilder<T> | null; // Plugin's database table
  body: K | undefined; // Request body (POST/PUT)
  logger: {
    error: (msg: string) => void;
    warn: (msg: string) => void;
    info: (msg: string) => void;
    debug: (msg: string) => void;
  };
  previousAction: unknown; // Result from previous action in chain
}
```

## Related

- [DockStat](https://github.com/Its4Nik/DockStat) - The main DockStat project
- [@dockstat/plugin-handler](https://www.npmjs.com/package/@dockstat/plugin-handler) - Plugin runtime handler

## License

MIT - Part of the DockStat project.
