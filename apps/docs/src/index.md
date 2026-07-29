# DockStat

DockStat is a Docker container monitoring and management platform built as a
Bun monorepo. A single dashboard covers multiple Docker hosts, real-time
container metrics, an extensible plugin system, themeable UI, and a
remote-agent fleet for stack administration.

> [!WARNING]
> DockStat is currently under active pre-alpha development. Expect breaking
> changes, new features, API changes, and base architecture changes.

## Where to start

- **[Architecture overview](./architecture.md)** — system design, runtime
  topology, and how the frontend, backend, remote agents, and plugin host
  fit together.
- **[Contributing](./resources/contributing.md)** — local development setup,
  scripts, and PR conventions.
- **[Deployment](./resources/deployment.md)** — environment variables,
  production hardening checklist, and runbook references.

## Applications

| Application | Purpose | Default port |
|-------------|---------|--------------|
| [`@dockstat/api`](./apps/api.md) | Elysia backend with HTTP + WebSocket routes | `3030` |
| [`@dockstat/frontend`](./apps/dockstat.md) | React Router v7 dashboard with server-side rendering | `5173` / `3000` |
| [`@dockstat/docknode`](./apps/docknode.md) | Remote agent for translating DockStacks into Swarm services | `4040` |
| [`@dockstat/store-verification`](./apps/dockstore.md) | Plugin verification server with HTMX templating | `3100` |

Per-application references live under [Applications](./apps/api.md).

## Packages

The shared libraries that power DockStat, grouped by concern.

**Frontend and integration**

- [`@dockstat/auth`](./packages/auth.md) — OIDC proxy and JWT middleware for
  Elysia.
- [`@dockstat/theme-handler`](../../../packages/theme-handler) — server +
  client theme system.
- [`@dockstat/ui`](../../../packages/ui) — React UI component library.
- [`@dockstat/utils`](../../../packages/utils) — shared utilities including
  the Eden Treaty client.

**Backend runtime**

- [`@dockstat/db`](../../../packages/db) — application tables and
  migrations.
- [`@dockstat/sqlite-wrapper`](./packages/sqlite-wrapper.md) — type-safe
  SQLite QueryBuilder.
- [`@dockstat/logger`](../../../packages/logger) — structured, leveled
  logger.
- [`@dockstat/errors`](../../../packages/errors) — shared error types and
  helpers.
- [`@dockstat/typings`](../../../packages/typings) — shared TypeScript types
  and Typebox schemas.

**Docker stack**

- [`@dockstat/bun-docker`](../../../packages/bun-docker) — Bun-native
  Dockerode wrapper.
- [`@dockstat/docker-client`](./packages/docker.md) — worker-isolated
  multi-host manager.
- [`@dockstat/docker-swarm`](./packages/docker.md) — Swarm stacks, services,
  networks, configs, and secrets.

**Plugin and widget system**

- [`@dockstat/plugin-builder`](./packages/plugins.md) — fluent builder for
  type-safe plugins.
- [`@dockstat/plugin-handler`](./packages/plugins.md) — runtime plugin
  loader and lifecycle.
- [`@dockstat/template-renderer`](./packages/template-renderer.md) —
  plugin-driven template engine.
- [`@dockstat/repo-cli`](../../../packages/repo-cli) — repository CLI for
  plugin bundling.
- [`widgets`](./packages/widgets.md) — dashboard widgets and data pipes.

## Documentation conventions

This site is built with [MkDocs](https://www.mkdocs.org/) and the
[Material](https://squidfunk.github.io/mkdocs-material/) theme. Source files
ship with the repository under `apps/docs/src/`. Run `bun run docs:serve`
from the repo root to preview changes locally.

## Next steps

1. Read the [Architecture overview](./architecture.md) to understand how
   the frontend, backend, remote agents, and plugin host connect.
2. Jump to [API reference](./apps/api.md) if you plan to extend the backend.
3. Read [Contributing](./resources/contributing.md) before opening a pull
   request.
