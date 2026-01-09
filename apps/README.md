# Applications

This directory contains all the applications in the Dockstat monorepo.

## 🏗️ Application Overview

### `api`

**Backend Server** - Tying all elements of the DockStat Monorepo together

**Features:**

- Bun native runtime
- ElysiaJS
- Scalar API docs (available at `/api/v2/docs`)
  - OpenAPI Spec sheet at `/api/v2/docs/json`
- Websocket support

### `dockstat`

**Frontend Application** - React + React Router (Declarative mode)

The main user interface for Docker container monitoring and management. Built with React Router for client-side routing and modern React patterns.

**Features:**

- Real-time Docker container statistics
- Container management interface
- Theme support
- Plugins
- Responsive design with TailwindCSS

**Tech Stack:**

- React Router v7 (Declarative)
- TypeScript
- TailwindCSS
- Bun runtime
- Framer motion

### `dockstore`

**Community Hub** - Themes, Stacks & Plugins

A curated repository of Docker Compose templates, themes, and plugins for the Dockstat ecosystem.

**Features:**

- Pre-built Docker Compose templates
- Community-contributed themes
- Plugin marketplace
- Easy integration with DockStat

### `dockstore-verification`

**Verification for Plugins**

If a verifiation API is provided for a Repository, then all plugins will get compared against "trusted" packages. Each plugin version has to be manually approved.

**Features**

- Verification of Plugin versions

### `docs`

**Documentation Sync** - Outline Wiki Integration

Contains documentation files and sync configuration for bi-directional synchronization with Outline Wiki.

**Structure:**

- `docs/` - Markdown documentation files
- `outline-sync.config.json` - Outline sync manifest

## 🚀 Development

Each application can be developed independently:

```bash
# Start all apps in development mode
bun run dev

# Or start a specific app
cd apps/dockstat && bun run dev
cd apps/dockstore && bun run dev
```

## 🔧 Configuration

Each application has its own:

- `package.json` with app-specific dependencies
- `tsconfig.json` extending the base configuration
- Application-specific configuration files (.env)

## 📁 Adding New Applications

1. Create a new directory in `apps/`
2. Add `package.json` with required scripts:
   ```json
   {
     "scripts": {
       "dev": "...",
       "build": "...",
       "lint": "biome check .",
       "lint:fix": "biome check --write .",
       "check-types": "tsc --noEmit"
     }
   }
   ```
3. Add `tsconfig.json` extending base config
4. Update root `package.json` workspaces if needed

## 🤝 Shared Dependencies

Applications can use shared packages:

```typescript
import { DOCKER } from "@dockstat/typings";
import { Database } from "@dockstat/db";
import { SQLiteWrapper } from "@dockstat/sqlite-wrapper";
```

## 📄 Documentation

- Each app should maintain its own README
- Use JSDoc comments for API documentation
- Integration examples in individual app READMEs
