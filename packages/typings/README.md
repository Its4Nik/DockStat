# @dockstat/typings

Shared TypeScript type definitions for the DockStat monorepo. This package provides type safety across all applications and packages, ensuring consistency and preventing type-related errors.

## 🚀 Features

- **Comprehensive Types**: Complete type definitions for Docker entities
- **Shared Interfaces**: Common interfaces used across frontend and backend
- **Type Guards**: Runtime type validation utilities
- **Generic Types**: Reusable generic types for common patterns
- **API Types**: Request/response types for API endpoints
- **Configuration Types**: Type-safe configuration schemas

## 📦 Installation

```bash
# Install from monorepo root
bun install

# Or install individually (if published)
bun add @dockstat/typings
```

## 🔄 Versioning

This package follows semantic versioning:

- **Major**: Breaking changes to existing types
- **Minor**: New types or non-breaking additions
- **Patch**: Documentation updates, internal improvements

## 🤝 Integration

Used throughout the monorepo:

```typescript
// Frontend (React)
import type { THEME } from '@dockstat/typings';

// Backend
import type { DATABASE } from '@dockstat/typings';
```

## 📄 License

Part of the DockStat monorepo - MIT License.
