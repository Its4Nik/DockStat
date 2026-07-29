# Deployment

This page lists every environment variable DockStat recognizes, the default
ports every app exposes, and the production hardening checklist you must work
through before shipping.

## Ports at a glance

| App | Default port | Override |
|-----|--------------|----------|
| `@dockstat/api` | `3030` | `DOCKSTATAPI_PORT` |
| `@dockstat/frontend` | dev `5173` / prod `3000` | Vite + container settings |
| `@dockstat/docknode` | `4040` | `PORT` |
| `@dockstat/store-verification` | `3100` | `VERIFICATION_PORT` |

The frontend proxies API traffic to the backend, so a typical setup exposes
only the frontend on `3000` and keeps the API on `3030` behind the same
domain.

## Backend (`@dockstat/api`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DOCKSTATAPI_PORT` | `3030` | Listening port |
| `DOCKSTATAPI_SHOW_TRACES` | `true` | Emit Server-Timing headers |
| `DOCKSTAT_MAX_WORKERS` | `200` | Max DockerClientManager worker threads |
| `DOCKER_HOST` / `DOCKER_SOCKET_PATH` / `DOCKER_SOCKET` | unset | Where the local daemon lives |
| `DOCKER_API_VERSION` | unset | Pins the API version when talking to a daemon |
| `DOCKER_BIN_PATH` | unset | Override the Docker binary location |
| `DOCKER_CLIENT_LOG_LEVEL` | unset | Per-client logger threshold |

## Authentication (`@dockstat/auth`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `BASE_URL` | yes | Public URL of the auth callback |
| `FRONTEND_URL` | yes | Browser URL after callback completes |
| `JWT_SECRET` | yes | HMAC secret. Generate with `openssl rand -hex 64` |
| `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ISSUER`, `OIDC_REDIRECT_URI`, `OIDC_SCOPE` | per provider | Default OIDC provider overrides |
| `SECRET` | yes | Encryption key for stored OIDC client secrets |

> [!WARNING]
> Rotate `JWT_SECRET` (and the matching `SECRET`) whenever an operator with
> access leaves the team. Treat both as production database passwords.

## Logger (`@dockstat/logger`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DOCKSTAT_LOGGER_LEVEL` | `info` | Minimum level (`debug`, `info`, `warn`, `error`) |
| `DOCKSTAT_LOGGER_DISABLED_LOGGERS` | unset | Comma-separated logger list to suppress |
| `DOCKSTAT_LOGGER_ONLY_SHOW` | unset | Comma-separated allow list |
| `DOCKSTAT_LOGGER_IGNORE_MESSAGES` | unset | Comma-separated message substrings to drop |
| `DOCKSTAT_LOGGER_FULL_FILE_PATH` | `false` | Show absolute paths in log lines |
| `DOCKSTAT_LOGGER_SEPERATOR` | `:` | Logger name separator |

## Database (consumed by `@dockstat/sqlite-wrapper`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DOCKSTAT_DB_BACKUP_INTERVAL` | unset | Auto-backup interval (ms) |
| `DOCKSTAT_MAX_DB_BACKUPS` | `10` | Retention count |
| `CRYPTO_SECRET` | unset | Symmetric key used for stored-provider secret encryption |

These are read by the application boot script; tune them in your process
supervisor or via the API itself after the DB is created.

## Certificates and TLS

| Variable | Default | Purpose |
|----------|---------|---------|
| `CERT_FILE` | unset | Path to the PEM-encoded certificate for HTTPS bootstrap |
| `KEY_FILE` | unset | Path to the PEM-encoded private key for HTTPS bootstrap |
| `CA_FILE` | unset | Optional CA bundle for verifying client certificates |

The certificate routes in `apps/api/src/routes/certificates` read these paths
the first time the API boots in TLS mode and create a self-signed fallback if
they are missing.

## Authentication toggles

| Variable | Default | Purpose |
|----------|---------|---------|
| `AUTH_ENABLED` | unset | Master switch to disable authentication (dev only); when unset, the API enforces auth through `@dockstat/auth` |
| `API_KEY` | unset | Single global API key accepted in `X-API-Key` headers |
| `API_KEYS_ENABLED` | unset | Enables the per-user API-key subsystem |

## DockNode (`@dockstat/docknode`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DOCKNODE_DOCKSTACK_AUTH_PSK` | unset | Production PSK (use in prod) |
| `DOCKNODE_DOCKSTACK_DEV_AUTH` | unset | Development-only key |
| `DOCKNODE_DOCKSTACK_AUTH_PRIORITY` | unset | `"psk"` or `"dev"`; flips the default |
| `PORT` | `4040` | Agent listening port |

Always set `DOCKNODE_DOCKSTACK_AUTH_PRIORITY=psk` and unset
`DOCKNODE_DOCKSTACK_DEV_AUTH` for production deployments.

## Plugin + widget infrastructure

| Variable | Default | Purpose |
|----------|---------|---------|
| `PLUGIN_API_KEY` | unset | API key for cross-app plugin traffic |
| `PLUGIN_ENDPOINT` | unset | External endpoint exposed to plugins |
| `VERIFICATION_DB_PATH` | `verification.db` | SQLite file for the verification server |
| `VERIFICATION_PORT` | `3100` | Verification server port |

## Frontend (`@dockstat/frontend`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `/api/v2` | Backend base URL exposed to the bundle |
| `FRONTEND_URL` | unset | URL the auth callback returns to |
| `SECRET` | unset | Used during build for auth-related assets |

`VITE_API_URL` is the most important one — set it to the backend's public
URL (for example `https://dockstat.example.com/api/v2`) when the frontend
and backend are on different origins.

## OIDC and integration

| Variable | Default | Purpose |
|----------|---------|---------|
| `OIDC_ISSUER` | unset | Issuer URL for the default provider |
| `OIDC_CLIENT_ID` | unset | Default provider's client ID |
| `OIDC_CLIENT_SECRET` | unset | Default provider's client secret |
| `OIDC_REDIRECT_URI` | unset | Default provider's redirect URI |
| `OIDC_SCOPE` | `openid profile email` | Default provider's scope |

You can register additional providers through `POST /auth/providers` once
the API is running.

## Documentation + outline sync

`@dockstat/outline-sync` is a CLI utility under `packages/outline-sync` that
mirrors an external Outline wiki into the local `apps/docs` folder. The repo
ships an active CI workflow (`.github/workflows/docs-sync.yaml`) that
installs the CLI globally, runs `outline-sync ci` against `./apps/docs` on
every push to `main` and on a six-hour cron, and auto-commits the synced
markdown. Treat the configuration as required for any deployment that still
publishes the legacy wiki mirror; for the on-disk `apps/docs` workflow, the
sync is optional once your branches supersede the wiki.

| Variable | Default | Purpose |
|----------|---------|---------|
| `OUTLINE_TOKEN` | unset | API token used by `outline-sync` |
| `OUTLINE_URL` | unset | Outline instance URL |
| `OUTLINE_OUTPUT_DIR` | unset | Local output directory (defaults to `./outline-docs`) |
| `OUTLINE_CONFIG` | unset | Path to `outline-sync.config.{json,yaml,yml,js,cjs}` if not using flags |

## Migrations and rollouts

1. Run `bun run check-types` and `bun run build` once before each release.
2. Apply DB migrations manually only when `createTable`'s automatic migration
   is unsafe (for example, dropping a NOT NULL column). When you must do a
   manual migration, take a backup first with
   `@dockstat/sqlite-wrapper`'s `db.backup()`.
3. After the API boots, hit `GET /api/v2/status` to confirm the worker
   manager reports healthy clients.
4. Confirm the verification server can reach its DB path and report
   `/health` returning `200`.

## Production hardening checklist

Run through this list before declaring a deployment production-ready:

> [!IMPORTANT]
> Every item must be ticked. Skipping one creates a positive attack surface.

- TLS termination in front of the API and frontend; `BASE_URL` and
  `FRONTEND_URL` use HTTPS.
- A real `JWT_SECRET` and `SECRET` generated with `openssl rand -hex 64`,
  stored in the secrets manager, rotated quarterly.
- Cookies use `Secure`, `HttpOnly`, and `SameSite=Lax` (the auth code sets
  these automatically when `BASE_URL` is HTTPS).
- API-key scopes are tuned. Default `*` is fine for admins, but every
  service account should carry a narrower scope.
- `DOCKSTAT_LOGGER_LEVEL=warn` in production; drop to `debug` only when
  investigating an active incident.
- Auto-backups enabled with retention tuned to storage budget.
- DockNode runs with PSK authentication only — no dev key.
- Verification server runs behind an authenticated access boundary; do not
  expose it to the internet without a reverse proxy.
- Frontend bundle uses a CSP that disallows inline scripts except for the
  documented nonces. Confirm via the deploy health check.

## Next steps

- See [Contributing](./contributing.md) for the local development workflow.
- See [Architecture overview](../architecture.md) for the system map.
