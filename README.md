# Dockstat Monorepo

A modern monorepo built with Turborepo, Bun, and Biome for managing Docker container statistics and monitoring.

## 🚀 Tech Stack

- **Monorepo**: Turborepo
- **Runtime**: Bun
- **Linting & Formatting**: Biome
- **TypeScript**: Strict configuration
- **Apps**: React Router, Node.js applications
- **Packages**: Shared utilities and types

## 📁 Project Structure

```
dockstat/
├── apps/
│   ├── dockstat/          # Frontend
│   ├── dockstore/         # Community made themes, stacks and plguins
│   └── docs/              # Custom API plugin for [Outline Wiki](https://github.com/Outline/Outline) + Git sync
├── packages/
│   ├── dockstatapi/       # Backend
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

Shared TypeScript configuration in `tscofig.base.json`:

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
import { DockstatApi } from '@dockstat/backend';
```

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
cd packages/dockstatapi && bun run build
```

## 🚀 Deployment

Each app can be built and deployed independently:

```bash
# Build for production
bun run build

# The built artifacts will be in:
# - apps/dockstat/build/
# - packages/dockstatapi/dist/
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
