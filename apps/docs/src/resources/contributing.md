# Contributing

This page covers how to set up DockStat locally, run the workspace tooling,
add a package or route, and open a pull request that lands cleanly.

## Prerequisites

- **Bun 1.3.x** as the runtime and package manager.
- **Docker Engine** if you plan to exercise the API, docknode, or the worker
  code path. The repository ships a dev compose stack in `.dev_env/`.
- **Git** and a working SSH key for pushing branches.

Clone the repository and install dependencies from the workspace root:

```bash
git clone [email protected]:Its4Nik/DockStat.git
cd DockStat
bun install
```

> [!TIP]
> Use the `bun-version` file at the repo root to pin your local runtime to
> the version the maintainers rely on.

## Common scripts

The root `package.json` defines the scripts exposed to every workspace
member. The most common ones:

| Script | Purpose |
|--------|---------|
| `bun run dev` | Run every `dev` task through Turbo (interactive TUI sweep) |
| `bun run dev:dockstat` | Bring up dev Docker + run frontend, API, verification, docknode |
| `bun run dev:dockstat:no-docker` | Same as above but skip the Docker stack |
| `bun run dev:minimal` | API + frontend only |
| `bun run build` | `turbo run build` across every package |
| `bun run check-types` | `turbo run check-types` for type checking |
| `bun run lint` | Per-package Biome lint |
| `bun run lint:all` | Workspace-wide Biome check |
| `bun run format:all` | Biome format everything |
| `bun run pub` | Publish the public packages in the correct order |
| `bun run clean` | Drop cache + `node_modules` for a fresh tree |

### Targeting a single workspace

Use Turbo's `--filter` flag to scope scripts:

```bash
bun run dev --filter=@dockstat/api
bun run check-types --filter=@dockstat/frontend
bun run lint --filter=@dockstat/sqlite-wrapper
```

## Project layout

| Path | Use it when… |
|------|--------------|
| `apps/api` | …you're adding backend routes, OpenAPI schemas, or auth handlers |
| `apps/dockstat` | …you're shipping dashboard pages or React UI |
| `apps/docknode` | …you need to extend the remote agent protocol |
| `apps/dockstore-verification` | …you maintain the verification server |
| `packages/<name>` | …you want to publish a shared library |
| `apps/docs` | …you're writing or updating documentation |

## Adding a new backend route

1. **Pick a domain folder** under `apps/api/src/routes/`. If your route does
   not fit an existing folder, create a new one.
2. **Add a Typebox schema** under `apps/api/src/models/<domain>.ts`. The
   schema drives validation, OpenAPI output, and the typed Eden client.
3. **Add a route module** exporting a named Elysia sub-app. Use the
   `authenticated()` decorator from `@dockstat/auth` unless the route is
   intentionally public.
4. **Mount the sub-app** inside the auth guard in `apps/api/src/index.ts`.
5. **Add a typed hook** under `apps/dockstat/src/hooks/queries` (read) or
   `apps/dockstat/src/hooks/mutations` (write). Always reset the related
   query cache after a successful mutation.
6. **Add a doc snippet** in `apps/docs/apps/api.md` when the route is part
   of the public surface.

## Adding a new shared package

Public packages cover libraries you intend to publish. Private packages stay
inside the monorepo but still benefit from a dedicated workspace.

1. Create the folder under `packages/<name>` with a `package.json`,
   `tsconfig.json`, and `src/index.ts`.
2. Declare the package in the root `package.json` `workspaces` array (or
   add it to the catalog if you depend on it).
3. Reference it via `workspace:*` from the consumer's `package.json`.
4. Document it under `apps/docs/packages/<name>.md`. Use the structure of
   `packages/auth.md` as a template.

## Working with Storybook

The UI package ships a Storybook under `packages/ui/.storybook`. Use it when
you design new components:

```bash
bun run dev --filter=@dockstat/ui
```

Stories live next to each component under `packages/ui/src/stories`. After
adding a new story, run the lint pass on the package and update the typings
package if your component exposes new props that the dashboard consumes.

## Coding conventions

DockStat uses Biome for linting and formatting. Key policy:

- **Two-space indentation**, single quotes, semicolons required.
- **No `any`** unless gated by a biome-ignore comment with a justification.
- **Default exports** are discouraged in package code — prefer named exports.
- **Typebox schemas** live in `apps/api/src/models` and `packages/typings/src/typebox`.
- **Always declare `invalidateQueries`** on every `eden.mutate(...)` and
  `eden.mutateRoute(...)` call so the affected query caches refresh after a
  successful mutation. Each inner array is a TanStack `queryKey`, so include
  every key whose data the mutation could change.
- **Never write secrets to the repo**. Use environment variables and
  document them under `apps/docs/resources/deployment.md`.

Run the lint and formatting tasks before opening a PR:

```bash
bun run lint:all
bun run format:all
bun run check-types
```

## Pull request checklist

Before pushing a branch, walk through this list:

1. The branch builds: `bun run build`.
2. Type checks pass: `bun run check-types`.
3. Lint passes: `bun run lint:all`.
4. Format passes: `bun run format:check:all`.
5. New docs are linked from the relevant `apps/docs` page and the root
   README.
6. New env vars are documented in `apps/docs/resources/deployment.md`.
7. New schema fields are reflected in the Typebox model and Eden types.
8. New hooks invalidate the related query cache.

Then push and open a PR. Reference any related issue in the description and
include screenshots or short clips for UI changes.

## Reporting issues

When filing a bug, include:

- A clear description of the expected vs. observed behavior.
- Reproduction steps with the smallest possible workspace state.
- Log excerpts with `DOCKSTAT_LOGGER_LEVEL=debug` if a backend issue.
- The Bun, OS, and Docker versions you are running.

## Next steps

- [Deployment](./deployment.md) — environment variables and production
  hardening checklist.
- [Architecture overview](../architecture.md) — context on where your
  change slots into the system.
