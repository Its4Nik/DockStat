# DockStore and verification

DockStat distributes plugins and themes through two companion apps:

- `apps/dockstore` — a static registry that hosts plugin and theme
  manifests plus their source bundles.
- `apps/dockstore-verification` — a verification server that lets
  maintainers review code, hash versions, and tag plugins with a security
  status.

Together they form a full review pipeline: a plugin author publishes a
manifest to the registry; a maintainer verifies the bundle through the
verification server; the API pulls the approved plugin and loads it.

## `apps/dockstore`

The registry ships as a static collection of plugin and theme folders. Each
plugin defines its own `manifest.json`, source under `src/`, and an entry
point (`index.ts`).

### Layout

```
apps/dockstore/
├── plugins/
│   └── DockStacks/                # example plugin
│       ├── src/
│       │   ├── handler/index.ts   # type-safe actions
│       │   ├── plugin/actions.ts
│       │   └── types.ts
│       ├── index.ts               # default export = definePlugin(...)
│       ├── package.json
│       └── tsconfig.json
├── repo.json                      # registry summary
└── README.md
```

Each plugin uses [`@dockstat/plugin-builder`](../packages/plugins.md) to declare
its table, actions, and routes:

```typescript
// apps/dockstore/plugins/DockStacks/src/index.ts (excerpt)
export default definePlugin<DockStackData, typeof actions>({
  name: "dockstacks",
  description: "Manage compose-derived stacks on remote DockNodes",
  version: "1.0.0",
  repository: "https://github.com/Its4Nik/DockStat",
  repoType: "github",
  author: { name: "Its4Nik", email: "[email protected]" },
  config: {
    table: {
      name: "dockstacks",
      columns: {
        id: column.id(),
        name: column.text({ notNull: true }),
        yaml: column.text(),
        env: column.json(),
      },
      parser: { JSON: ["env"] },
    },
    actions,
    apiRoutes: {
      "/stacks": { method: "GET", actions: ["listStacks"] },
      "/stacks": { method: "POST", actions: ["createStack"] },
    },
  },
})
```

## `apps/dockstore-verification`

The verification server is a small Elysia app with HTMX templating. Operators
use it to review versions, compute hashes, and record approvals.

### What lives there

```
src/
├── _start.ts            # main entry (avoids spurious bun SIGINT line)
├── index.tsx            # secondary entry
├── db/                  # SQLite schema
├── services/            # hashing, repository fetchers, url helpers
├── routes/              # API + page routes
├── views/               # JSX pages (rendered server-side)
└── components/          # Plugin card, plugins table, etc.
```

### Quick start

```bash
cd apps/dockstore-verification
bun install
bun run dev          # http://localhost:3100
```

For dockerized deployment:

```bash
bun run build:docker
docker run -d \
  -p 3000:3200 \
  -v $(pwd)/data:/opt/dockstore-verification/data \
  -v $(pwd)/public:/opt/dockstore-verification/public \
  dockstore-verification:latest
```

### Verification workflow

Two entry paths exist; pick one per plugin per version.

1. **Repository-based** (recommended):

   1. Add a repository: `POST /api/repositories`.
   2. Sync plugins: `POST /api/repositories/:id/sync`.
   3. Review code under **Plugins → <name> → versions**.
   4. Verify a version: `POST /api/plugins/:id/versions/:version/verify`.

2. **Manual entry**:

   1. POST `/api/plugins/manual` with the bundle metadata, hashes, and
      author info.
   2. The plugin appears in the **Manual Entries** repository and follows
      the same verification flow.

### Database tables

| Table | Purpose |
|-------|---------|
| `repositories` | Tracked plugin repositories (GitHub, GitLab, HTTP) |
| `plugins` | Individual plugins across repositories |
| `plugin_versions` | Per-version bundle with SHA-256 hashes |
| `verifications` | Approval record per version (safe / unsafe / unknown) |

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VERIFICATION_PORT` | `3100` | Server port |
| `VERIFICATION_DB_PATH` | `verification.db` | SQLite database file |
| `DOCKSTAT_LOGGER_LEVEL` | `info` | Minimum log level |
| `DOCKSTAT_LOGGER_DISABLED_LOGGERS` | `"QueryBuilder,Sqlite-Wrapper"` | Suppress chatty DB loggers |
| `DOCKSTAT_LOGGER_IGNORE_MESSAGES` | `"Logger Status: active"` | Drop log lines matching this text |
| `DOCKSTAT_LOGGER_FULL_FILE_PATH` | `false` | Display absolute file paths |

### API surface

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health probe |
| `/api/stats` | GET | Dashboard statistics |
| `/api/repositories` | GET / POST | List or add a repository |
| `/api/repositories/:id` | GET / DELETE | Inspect or delete |
| `/api/repositories/:id/sync` | POST | Pull the latest plugin list |
| `/api/repositories/:id/toggle` | PATCH | Enable or disable sync |
| `/api/plugins` | GET | List all plugins |
| `/api/plugins/manual` | POST | Add a plugin by hand |
| `/api/plugins/:id` | GET | Plugin detail |
| `/api/plugins/:id/versions/:version/verify` | POST | Approve / reject a version |

### Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with verification stats |
| `/plugins` | Plugin list with filters |
| `/plugins/add` | Manual plugin entry |
| `/plugins/:id` | Plugin detail |
| `/repositories` | Repository list |
| `/repositories/:id` | Repository detail |
| `/repositories/add` | New repository form |
| `/verify` | Manual verification interface |
| `/compare` | Side-by-side version comparison |

## Next steps

- See [packages/plugins.md](../packages/plugins.md) for the full plugin
  authoring guide.
- See [resources/deployment.md](../resources/deployment.md) to deploy the
  verification server behind a TLS terminator.
