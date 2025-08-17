# DockStat Monorepo Overview

Welcome to the DockStat monorepo - a modern, scalable architecture for Docker container monitoring and management.

## 🏗️ Architecture

DockStat is built as a monorepo using Turborepo, providing a collection of interconnected applications and packages that work together to deliver comprehensive Docker monitoring capabilities.

```
dockstat/
├── apps/                    # Applications
│   ├── dockstat/           # Frontend (React Router)
│   ├── dockstore/          # Community marketplace
│   └── docs/               # Documentation sync
├── packages/               # Shared packages
│   ├── db/                 # Database layer
│   ├── docker-client/      # Docker API client
│   ├── outline-sync/       # Documentation sync tool
│   ├── sqlite-wrapper/     # Type-safe SQLite wrapper
│   └── typings/            # Shared TypeScript types
└── infrastructure/         # Build & CI configuration
```

## 🚀 Tech Stack

- **Monorepo Management**: Turborepo
- **Runtime**: Bun (>=1.2.17)
- **Languages**: TypeScript (strict mode)
- **Code Quality**: Biome (linting & formatting)
- **Frontend**: React Router v7
- **Database**: SQLite with custom wrapper
- **Docker Integration**: Dockerode
- **Package Manager**: Bun workspaces

## 📱 Applications

### DockStat Frontend (`apps/dockstat`)
Modern React Router v7 application providing the main user interface for Docker container monitoring.

**Features:**
- Real-time container statistics
- Multi-host Docker environment support
- Responsive dashboard
- Container management interface

**Tech Stack:**
- React Router v7
- TailwindCSS v4
- TypeScript
- Server-side rendering

### DockStore (`apps/dockstore`)
Community marketplace for themes, stacks, and plugins.

**Features:**
- Stack templates
- Theme marketplace
- Plugin distribution
- Community contributions

**Tech Stack:**
- Bun native
- TypeScript
- Generator tooling

### Documentation (`apps/docs`)
Bi-directional documentation sync with Outline Wiki.

**Features:**
- Git-based documentation
- Outline Wiki integration
- Automated synchronization
- Markdown processing

## 📦 Core Packages

### Database Layer (`@dockstat/db`)
Centralized database operations and models.

**Capabilities:**
- Container statistics storage
- Host information management
- Historical data queries
- Configuration management

### Docker Client (`@dockstat/docker-client`)
Docker API integration powered by Dockerode.

**Features:**
- Multi-host Docker connections
- Real-time container monitoring
- Docker API abstraction
- WebSocket integration support

### SQLite Wrapper (`@dockstat/sqlite-wrapper`)
Type-safe SQLite operations with query building.

**Features:**
- Type-safe queries
- Migration support
- Query builder
- Bun SQLite integration

### Outline Sync (`@dockstat/outline-sync`)
Published CLI tool for Git-Outline Wiki synchronization.

**Features:**
- Bi-directional sync
- Git timestamp-based conflict resolution
- Collection management
- CLI and programmatic API

### Typings (`@dockstat/typings`)
Shared TypeScript type definitions.

**Coverage:**
- Docker API types
- Database schemas
- Application interfaces
- Configuration types

## 🔄 Data Flow

```mermaidjs
graph TD
    A[Docker Hosts] --> B[Docker Client]
    B --> C[Database Layer]
    C --> D[Frontend]
    
    E[Outline Wiki] <--> F[Docs App]
    F --> G[Git Repository]
    
    H[Community] --> I[DockStore]
    I --> D
    
    J[SQLite] <--> C
    K[Type Definitions] --> L[All Apps]
```

## 🛠️ Development Workflow

### Quick Start

```bash
# Clone and setup
git clone https://github.com/Its4Nik/DockStat.git
cd DockStat
bun install

# Development
bun run dev          # Start all apps
bun run build        # Build all packages
bun run lint         # Lint everything
bun run test         # Run tests
```

### Package Development

```bash
# Work on specific package
cd packages/docker-client
bun run dev

# Build and test
bun run build
bun run test
```

### App Development

```bash
# Frontend development
cd apps/dockstat
bun run dev

# Documentation
cd apps/docs
bun run sync
```

## 🏗️ Build System

The monorepo uses Turborepo for efficient builds with:

- **Dependency Graph**: Automatic package ordering
- **Caching**: Build and test result caching
- **Parallel Execution**: Concurrent task execution
- **Watch Mode**: Development-friendly rebuilds

### Build Targets

- `build`: Compile TypeScript and bundle assets
- `dev`: Start development servers with watch mode
- `lint`: Code quality checks
- `test`: Unit and integration tests
- `clean`: Remove build artifacts

## 📊 Package Dependencies

```mermaidjs
graph TD
    A[typings] --> B[db]
    A --> C[docker-client]
    A --> D[sqlite-wrapper]
    
    B --> E[dockstat app]
    C --> E
    D --> B
    
    F[outline-sync] --> G[docs app]
    
    H[dockstore] --> E
```

## 🔒 Security & Configuration

### Environment Variables

Each app and package handles configuration through:
- Environment variables
- Configuration files
- Runtime configuration APIs

### Security Considerations

- Type-safe database queries
- Input validation
- Secure Docker API communication
- Authentication middleware

## 📈 Monitoring & Observability

The monorepo includes built-in monitoring:

- **Build Monitoring**: Turborepo task execution
- **Type Safety**: Comprehensive TypeScript coverage
- **Code Quality**: Biome linting and formatting
- **Testing**: Bun test runner integration

## 🤝 Contributing

### Adding New Packages

1. Create package directory in `packages/`
2. Add `package.json` with standard scripts
3. Include in workspace dependencies
4. Update documentation

### Adding New Apps

1. Create app directory in `apps/`
2. Configure build and dev scripts
3. Set up routing and dependencies
4. Add to Turborepo pipeline

### Code Standards

- **TypeScript**: Strict mode required
- **Formatting**: Biome configuration
- **Testing**: Bun test coverage
- **Documentation**: Inline and markdown docs

## 🚀 Deployment

### Production Builds

```bash
bun run build
```

### Package Publishing

Published packages:
- `@dockstat/outline-sync` - npm registry
- `@dockstat/docker-client` - npm registry
- `@dockstat/sqlite-wrapper` - npm registry

### Application Deployment

- Frontend: Static build output
- Documentation: Automated sync
- DockStore: Static generation

## 📚 Documentation Structure

- **Overview**: This document
- **Apps**: Individual app documentation
- **Packages**: Package-specific guides
- **API**: Generated API documentation
- **Tutorials**: Step-by-step guides

For detailed information about specific components, see the individual documentation files for each app and package.