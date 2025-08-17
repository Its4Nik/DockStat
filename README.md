# Dockstat Monorepo

A modern monorepo built with Turborepo, Bun, and Biome for managing Docker container statistics and monitoring.

## 🚀 Tech Stack

- **Monorepo**: Turborepo
- **Runtime**: Bun
- **Linting & Formatting**: Biome
- **TypeScript**: Strict configuration
- **Apps**: React Router, Node.js applications
- **Packages**: Shared utilities, database layer, and types

## 📁 Project Structure

```
dockstat/
├── apps/
│   ├── dockstat/          # Frontend (React Router)
│   ├── dockstore/         # Community made themes, stacks and plugins
│   └── docs/              # Documentation sync with Outline Wiki
├── packages/
│   ├── db/                # Database layer and models
│   ├── outline-sync/      # Bi-directional sync between Git and Outline Wiki
│   ├── sqlite-wrapper/    # Type-safe SQLite wrapper
│   └── typings/           # Shared TypeScript types
└── turbo.json             # Turborepo configuration
```

## 🛠️ Setup

### Prerequisites

- [Bun](https://bun.sh/) >= 1.2.17
- Node.js >= 18 (for some tooling)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Its4Nik/DockStat.git
   cd DockStat
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up development environment**
   ```bash
   # Build all packages
   bun run build

   # Start development servers
   bun run dev
   ```

## 📜 Available Scripts

### Root Level Commands

```bash
# Development
bun run dev          # Start all apps in development mode
bun run build        # Build all apps and packages
bun run lint         # Lint all packages and apps
bun run lint:fix     # Fix linting issues
bun run format       # Format all code
bun run format:check # Check formatting
bun run check-types  # Type check all packages
bun run clean        # Clean all build artifacts
bun run test         # Run tests across all packages
```

### Individual Package Commands

Each package and app supports these scripts:

```bash
bun run build        # Build the package
bun run dev          # Start development server
bun run lint         # Lint the package
bun run lint:fix     # Fix linting issues
bun run check-types  # Type check the package
bun run clean        # Clean build artifacts
```

## 🔧 Configuration

### Turborepo

The monorepo uses Turborepo for build orchestration. Configuration is in `turbo.json`:

- **Build**: Dependencies are automatically resolved
- **Dev**: Persistent development servers
- **Lint**: No outputs (stateless)
- **Test**: Depends on build, outputs coverage

### Biome

Code formatting and linting is handled by Biome. Configuration in `biome.json`:

- **Formatting**: 2-space indentation, 80 character line width
- **Linting**: Recommended rules with custom overrides
- **JavaScript**: Single quotes, trailing commas, semicolons

### TypeScript

Shared TypeScript configuration in `tsconfig.base.json`:

- **Module**: ESNext
- **Target**: ESNext
- **Strict**: Enabled
- **Paths**: Configured for monorepo packages

## 🏗️ Development

### Adding a New App

1. Create a new directory in `apps/`
2. Add `package.json` with required scripts
3. Add `tsconfig.json` extending the base config
4. Update root `package.json` workspaces if needed

### Adding a New Package

1. Create a new directory in `packages/`
2. Add `package.json` with required scripts
3. Add `tsconfig.json` extending the base config
4. Update root `package.json` workspaces if needed

### Workspace Dependencies

Use the `@dockstat/` prefix for internal packages:

```typescript
import { BaseConfig } from '@dockstat/typings';
import { Database } from '@dockstat/db';
import { SQLiteWrapper } from '@dockstat/sqlite-wrapper';
```

## 📦 Package Overview

### `@dockstat/db`
Database layer with models and data access patterns for Docker container statistics.

### `@dockstat/sqlite-wrapper`
A TypeScript wrapper around `bun:sqlite` with type-safe query building capabilities.

### `@dockstat/outline-sync`
A Bun CLI tool for bi-directional synchronization between Git-backed Markdown files and Outline Wiki collections.

### `@dockstat/typings`
Shared TypeScript type definitions used across all applications and packages.

## 📚 Documentation

The project uses Outline Wiki for documentation with bi-directional sync:

- Documentation files are stored in `apps/docs/docs/`
- Use `@dockstat/outline-sync` package to sync with Outline Wiki
- See `packages/outline-sync/README.md` for sync setup and usage

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run tests for a specific package
cd apps/dockstat && bun run test
```

## 📦 Building

```bash
# Build all packages and apps
bun run build

# Build a specific package
cd packages/db && bun run build
```

## 🚀 Deployment

Each app can be built and deployed independently:

```bash
# Build for production
bun run build

# The built artifacts will be in:
# - apps/dockstat/build/
# - packages/db/dist/
# - packages/outline-sync/dist/
# - packages/sqlite-wrapper/dist/
# - packages/typings/dist/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and type checking: `bun run lint && bun run check-types`
5. Commit your changes
6. Push to your branch
7. Create a pull request

## 📄 License

This project is licensed under the MIT License.