# DockStore Verification Server

A plugin verification server for DockStore that allows manual code review and security verification of plugins.

## Features

- **Repository Management**: Track multiple plugin repositories (GitHub, GitLab, HTTP)
- **Plugin Tracking**: Automatically sync and track plugins from repositories
- **Version Hashing**: Compute SHA-256 hashes for plugin source code and bundles
- **Manual Verification**: Review and verify each plugin version individually
- **Security Status**: Mark plugins as safe, unsafe, or unknown
- **Dashboard**: Visual overview of verification status across all plugins
- **HTMX Integration**: Interactive UI without full page reloads

## Quick Start

### Prerequisites

- [Bun](https://bun.com) runtime (v1.3+)
- SQLite (included with Bun)

### Installation

```bash
# Install dependencies
bun install
```

### Running the Server

```bash
# Development mode with hot reload
bun run dev

# Production mode
bun run start
```

The server will start at `http://localhost:3200` by default.

### Docker Deployment

```bash
# Build the docker image
cd apps/dockstore-verification
bun run build:docker

# Run the container
docker run -d \
  -p 3000:3200 \
  -v $(pwd)/data:/opt/dockstore-verification/data \
  -v $(pwd)/public:/opt/dockstore-verification/public \
  dockstore-verification:latest
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VERIFICATION_PORT` | `3100` | Server port |
| `VERIFICATION_DB_PATH` | `verification.db` | SQLite database path |
| `DOCKSTAT_LOGGER_DISABLED_LOGGERS` | `"QueryBuilder,Sqlite-Wrapper"` | What loggers should be ignored |
| `DOCKSTAT_LOGGER_IGNORE_MESSAGES` | `"Logger Status: active"` | What Log messages to ignore |
| `DOCKSTAT_LOGGER_FULL_FILE_PATH` | `false` | Show full file paths in log messages |
| `DOCKSTAT_LOGGER_LEVEL` | `info` | The minimum log level (debug => info => warn => error) |

## API Endpoints

### Pages

| Route | Description |
|-------|-------------|
| `GET /` | Dashboard with stats and recent plugins |
| `GET /plugins` | List all plugins with filtering |
| `GET /plugins/add` | Add plugin manually (without repository sync) |
| `GET /plugins/:id` | Plugin detail view |
| `GET /repositories` | List all repositories |
| `GET /repositories/:id` | Repository detail view |
| `GET /repositories/add` | Add repository form |
| `GET /verify` | Manual verification interface |

### API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/stats` | GET | Dashboard statistics |
| `/api/repositories` | GET | List all repositories |
| `/api/repositories` | POST | Add a new repository |
| `/api/repositories/:id` | GET | Get repository details |
| `/api/repositories/:id` | DELETE | Delete a repository |
| `/api/repositories/:id/sync` | POST | Sync repository plugins |
| `/api/repositories/:id/toggle` | PATCH | Enable/disable repository |
| `/api/plugins` | GET | List all plugins |
| `/api/plugins/manual` | POST | Manually add a plugin to the database |
| `/api/plugins/:id` | GET | Get plugin details |
| `/api/plugins/:id/versions/:version/verify` | POST | Verify a plugin version |
| `/api/sync-all` | POST | Sync all enabled repositories |
| `/health` | GET | Health check endpoint |

## Verification Process

### Option 1: Repository-Based (Recommended)

1. **Add Repository**: Register a plugin repository to track
2. **Sync Plugins**: Automatically fetch and hash plugin versions
3. **Review Code**: Manually review the plugin source code for security
4. **Verify**: Mark the version as verified with security status (safe/unsafe)
5. **Track Changes**: Each new version requires separate verification

### Option 2: Manual Entry

1. **Add Plugin Manually**: Use the "Add Plugin" button on the Plugins page
2. **Enter Details**: Provide plugin metadata, hashes, and author information
3. **Review**: Manually review the plugin source code for security
4. **Verify**: Mark the version as verified with security status (safe/unsafe)

Manual entries are stored in a special "Manual Entries" repository and can be verified just like repository-synced plugins.

## Database Schema

The server uses SQLite with the following tables:

- **repositories**: Tracked plugin repositories
- **plugins**: Individual plugins from repositories
- **plugin_versions**: Specific versions with hashes
- **verifications**: Verification records for each version

## Tech Stack

- **Runtime**: [Bun](https://bun.com)
- **Framework**: [Elysia](https://elysiajs.com)
- **Database**: SQLite via [@dockstat/sqlite-wrapper](../../packages/sqlite-wrapper)
- **UI**: Server-rendered JSX with [@elysiajs/html](https://elysiajs.com/plugins/html)
- **Interactivity**: [HTMX](https://htmx.org) (CDN)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) (CDN)

## Project Structure

```
src/
├── _start.ts          # Main entry point (If we run `bun run src/index.tsx` there will be a log line of bun that might confuse some users)
├── index.tsx          # Secondary entry point
├── db/
│   ├── index.ts       # Database initialization
│   └── types.ts       # TypeScript types for DB schema
├── services/
│   ├── hash.ts        # Hashing utilities
│   ├── url.ts         # utility functions for converting repository strings to viewable URLs
│   └── repository.ts  # Repository fetching service
├── routes/
│   ├── api.ts         # API endpoints
│   └── pages.tsx      # Page routes
├── views/
│   ├── Dashboard.tsx  # Dashboard view
│   ├── Plugins.tsx    # Plugins list/detail views
│   ├── Repositories.tsx # Repositories views
│   ├── PublicDashboard.tsx # A public dashboard
│   └── Verify.tsx     # Verification interface
└── components/
    ├── Layout.tsx     # Base layout
    ├── PluginCard.tsx # Plugin card component
    ├── StatsCard.tsx  # Statistics card
    └── PluginsTable.tsx # Plugins table
```

## License

MIT - Part of the DockStat project
