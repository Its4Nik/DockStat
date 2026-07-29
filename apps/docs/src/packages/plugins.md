# Plugin system

DockStat's plugin system is built on two collaborating packages:

- [`@dockstat/plugin-handler`](../../../../packages/plugin-handler) — the runtime
  loader. Lives in the API, manages the SQLite-backed plugin table, mounts
  plugin routes onto Elysia, and forwards events to plugins.
- [`@dockstat/plugin-builder`](../../../../packages/plugin-builder) — the fluent
  helper authors use to declare a plugin (table, actions, routes, events).

The two are designed together: a plugin is a TypeScript module that exports
the result of `definePlugin(...)` or `pluginBuilder().build()`. The handler
ingests that definition, writes it to the database, and `import()`s it on
activation.

## Plugin lifecycle

```text
manifest     ──►  install   ──►  stored in sqlite
                                  │
                                  ▼
                             activate
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
   dynamic import            mount routes              register hooks
        │                         │                         │
        └────────────────────►  API serves  ◄─────────── events fire
```

1. **Author** writes a plugin with `definePlugin` and ships a `manifest.json`.
2. **Install**: the API parses the manifest, validates it via
   `@dockstat/repo-cli`, and stores the source in the `plugins` table.
3. **Activate**: the handler writes the source to a temp file and
   `import()`s it. Plugin routes are mounted at `/api/v2/plugins/:id/routes/*`,
   plugin table is created under its declared name, and event hooks are
   wired into the Docker event stream.
4. **Deactivate**: the handler removes the routes, drops the hooks, and
   unloads the imported module from memory.

## Authoring a plugin

`@dockstat/plugin-builder` exposes a fluent API and a typed shortcut:

```typescript
import {
  definePlugin,
  createActions,
} from "@dockstat/plugin-builder"
import { column } from "@dockstat/sqlite-wrapper"

interface WidgetEntry {
  id: number
  name: string
  settings: Record<string, unknown>
}

const actions = createActions<WidgetEntry>({
  list: async ({ table, logger }) => {
    logger.info("Listing widgets")
    return table?.select(["*"]).all() ?? []
  },
  save: async ({ table, body, logger }) => {
    logger.info(`Saving widget ${body?.name}`)
    return table?.insertAndGet(body as WidgetEntry)
  },
})

export default definePlugin<WidgetEntry, typeof actions>({
  name: "widgets",
  description: "Save and list dashboard widgets",
  version: "1.0.0",
  repository: "https://github.com/Its4Nik/DockStat-widgets",
  repoType: "github",
  author: { name: "Its4Nik", email: "[email protected]" },

  config: {
    table: {
      name: "widgets_entries",
      columns: {
        id: column.id(),
        name: column.text({ notNull: true }),
        settings: column.json(),
      },
      parser: { JSON: ["settings"] },
    },
    actions,
    apiRoutes: {
      "/entries": { method: "GET", actions: ["list"] },
      "/entries": { method: "POST", actions: ["save"] },
    },
  },

  events: {
    onContainerStart: async (container, { logger }) => {
      logger.info(`Container started: ${container.id}`)
    },
  },
})
```

The fluent form covers the same surface if you prefer a step-by-step
builder:

```typescript
import { pluginBuilder } from "@dockstat/plugin-builder"

const plugin = pluginBuilder<WidgetEntry, typeof actions>()
  .name("widgets")
  .description("Save and list dashboard widgets")
  .version("1.0.0")
  .repository("https://github.com/Its4Nik/DockStat-widgets", "github")
  .author({ name: "Its4Nik", email: "[email protected]" })
  .table({
    name: "widgets_entries",
    columns: {
      id: column.id(),
      name: column.text({ notNull: true }),
      settings: column.json(),
    },
    parser: { JSON: ["settings"] },
  })
  .actions(actions)
  .apiRoutes({ "/entries": { method: "GET", actions: ["list"] } })
  .build()
```

## Action context

Every action receives a context object with the plugin's logger, optional
table, and the request body:

```typescript
interface PluginActionContext<T> {
  logger: Logger
  table?: QueryBuilder<T>
  body?: unknown
  // additional framework-provided helpers
}
```

Use it consistently — never reach into a global logger or a shared table.

## Frontend contribution

Plugins can also ship a `frontend` field that contributes routes and
templates to the dashboard:

```typescript
export default definePlugin({
  name: "widgets",
  // …
  frontend: {
    routes: [
      {
        path: "/widgets/list",
        template: { type: "container", children: [] },
        meta: { title: "Widget gallery", showInNav: true },
        loaders: [
          { id: "list-loader", apiRoute: "/entries", stateKey: "widgets" },
        ],
        actions: [
          { id: "refresh", type: "reload", loaderIds: ["list-loader"] },
        ],
      },
    ],
  },
})
```

The dashboard reads the manifest at boot via
`apps/dockstat/src/hooks/plugins/usePluginRoutes.ts` and merges the template
routes into the React Router tree. Templates are rendered by
[`@dockstat/template-renderer`](./template-renderer.md) without requiring a
recompile.

> [!NOTE]
> Frontend contribution is an experimental feature under active development.
> Expect breaking changes until a stable API ships.

## Runtime API

The exported `PluginHandler` class exposes the lifecycle hooks the API
consumes:

| Method | Purpose |
|--------|---------|
| `savePlugin(plugin, update?)` | Insert or update a plugin row |
| `deletePlugin(id)` | Remove the plugin and drop its table |
| `loadAllPlugins()` | Import every active plugin on boot |
| `loadPlugins(ids)` | Activate a specific set |
| `unloadPlugin(id)` | Tear down a plugin |
| `installFromManifestLink(url)` | Pull + verify + install |
| `getAllFrontendRoutes()` | Routes merged into the dashboard |
| `handleRoute(id, path, request)` | Execute a plugin route |

Plugins can also interact with plugin routes through the proxy mounted at
`/api/v2/plugins/:id/routes/*`. The proxy forwards the request to the
plugin's own Elysia instance without leaking plugin internals to the rest
of the API.

## Trust and verification

Before installing a plugin from a manifest URL, run it through
[`@dockstat/repo-cli`](../../../../packages/repo-cli) which bundles, validates,
and emits checksums. Then send the bundle through
[`apps/dockstore-verification`](../apps/dockstore.md) for human review and
hash tracking. The API only loads plugins that exist in its `plugins`
table; untrusted code never reaches the loader by accident.

## Next steps

- See [packages/auth.md](./auth.md) to expose plugin routes behind the
  authentication middleware.
- See [packages/sqlite-wrapper.md](./sqlite-wrapper.md) for the schema
  helpers your plugin table can reuse.
- See [resources/contributing.md](../resources/contributing.md) for the
  Storybook setup used to develop plugin UI in isolation.
