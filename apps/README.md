# Applications

This directory contains all the applications in the Dockstat monorepo.

## 🏗️ Application Overview

### `dockstat`
**Frontend Application** - React Router SPA

The main user interface for Docker container monitoring and management. Built with React Router for client-side routing and modern React patterns.

**Features:**
- Real-time Docker container statistics
- Container management interface
- Theme support
- Responsive design with TailwindCSS

**Tech Stack:**
- React Router v7
- TypeScript
- TailwindCSS
- Bun runtime

### `dockstore`
**Community Hub** - Themes, Stacks & Plugins

A curated repository of Docker Compose templates, themes, and plugins for the Dockstat ecosystem.

**Features:**
- Pre-built Docker Compose templates
- Community-contributed themes
- Plugin marketplace
- Easy integration with DockStat

**Included Templates:**
- AdGuardHome, Bookstack, Gitea
- Grafana, Heimdall, Home Assistant
- Nginx Proxy Manager, PiHole
- Uptime Kuma, Tianji, and more

### `docs`
**Documentation Sync** - Outline Wiki Integration

Contains documentation files and sync configuration for bi-directional synchronization with Outline Wiki.

**Structure:**
- `docs/` - Markdown documentation files
- `pages.json` - Outline sync manifest
- `sync.sh` - Sync script

## 🚀 Development

Each application can be developed independently:

```bash
# Start all apps in development mode
bun run dev

# Or start a specific app
cd apps/dockstat && bun run dev
cd apps/dockstore && bun run dev
```

## 📦 Building

Build all applications:

```bash
# From root
bun run build

# Or build individually
cd apps/dockstat && bun run build
cd apps/dockstore && bun run build
```

## 🔧 Configuration

Each application has its own:
- `package.json` with app-specific dependencies
- `tsconfig.json` extending the base configuration
- Application-specific configuration files

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
import { BaseConfig } from '@dockstat/typings';
import { Database } from '@dockstat/db';
import { SQLiteWrapper } from '@dockstat/sqlite-wrapper';
```

## 📄 Documentation

- Each app should maintain its own README
- Use JSDoc comments for API documentation
- Integration examples in individual app READMEs