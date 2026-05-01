# DockStat Frontend

The main web application for the DockStat Docker monitoring platform. Built with React, TypeScript, and Vite, providing a modern, responsive interface for managing Docker containers, hosts, and infrastructure.

## Description

DockStat Frontend is a single-page application (SPA) that serves as the primary user interface for the DockStat ecosystem. It provides real-time monitoring, container management, infrastructure visualization, and plugin integration through a modern, themeable web interface.

## Features

- **Infrastructure Graph**: Interactive visualization using React Flow for Docker containers and hosts
- **DockNodes Management**: Add, configure, and monitor remote Docker hosts with SSL support
- **Clients & Workers**: Manage Docker client pools, worker performance, and statistics
- **Stack Management**: Deploy and manage Docker Compose stacks from templates
- **Real-time Monitoring**: Live updates via WebSocket connections
- **Plugin System**: Runtime plugin support for UI components, backend services, and full-stack plugins
- **Theming Engine**: CSS variable-driven theming with live customization sidebar
- **Responsive Design**: Mobile-friendly with Framer Motion animations
- **Hotkey Support**: Configurable keyboard shortcuts for common actions
- **Dashboard Widgets**: Home-Assistant style widget system for custom dashboards

## Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Usage

### Development

The development server runs on `http://localhost:5173` by default:

```bash
bun run dev
```

### Configuration

Environment variables are configured in `.env` files:

- `VITE_API_URL`: Backend API URL (default: `http://localhost:3000/api/v2`)

### Key Routes

- `/` - Home dashboard with widgets
- `/docknodes` - Manage Docker hosts and connections
- `/clients` - View client and worker statistics
- `/containers` - Container management interface
- `/stacks` - Docker Compose stack deployment
- `/graph` - Infrastructure visualization
- `/plugins` - Plugin management and installation
- `/themes` - Theme customization
- `/settings` - Application settings and hotkeys

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **@dockstat/ui** - Shared component library
- **@dockstat/utils** - Utility functions

## Project Structure

```
src/
├── components/     # Reusable React components
├── contexts/       # React contexts (theme, config, etc.)
├── hooks/          # Custom React hooks
├── layout/         # Layout components (navbar, sidebar)
├── lib/            # Utility libraries and helpers
├── pages/          # Page components
└── main.tsx        # Application entry point
```

## API Reference

For detailed API documentation, see: [API Reference](../docs/dockstat/dockstat-app/README.md)

## Contributing

1. Follow the existing code style and structure
2. Use TypeScript for all new code
3. Add JSDoc comments for public APIs
4. Test your changes thoroughly

## License

[Mozilla Public License Version 2.0](../../LICENSE)

---

**Part of the DockStat Ecosystem**