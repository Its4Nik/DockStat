# DockStat Frontend

The DockStat frontend is a modern React Router v7 application that provides a comprehensive web interface for monitoring and managing Docker containers across multiple hosts.

## 🏗️ Architecture

### Tech Stack

- **Framework**: React Router v7
- **Styling**: TailwindCSS v4 with Vite plugin
- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Build**: Vite with React Router build system
- **SSR**: Server-side rendering support

### Key Dependencies

```json
{
  "@dockstat/typings": "workspace:*",
  "@dockstat/sqlite-wrapper": "workspace:*", 
  "@dockstat/db": "workspace:*",
  "@react-router/node": "^7.7.1",
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-router": "^7.7.1"
}
```

## 🚀 Features

### Dashboard
- **Real-time Monitoring**: Live container statistics and status updates
- **Multi-host Support**: Monitor containers across multiple Docker hosts
- **Resource Usage**: CPU, memory, and network statistics visualization
- **Container States**: Running, stopped, paused container management

### Container Management
- **Lifecycle Control**: Start, stop, restart, and remove containers
- **Log Viewing**: Real-time container log streaming
- **Inspection**: Detailed container configuration and metadata
- **Resource Limits**: View and modify container resource constraints

### Host Management
- **Host Discovery**: Add and configure multiple Docker hosts
- **Health Monitoring**: Host connectivity and Docker daemon status
- **Resource Overview**: Host-level CPU, memory, and storage metrics
- **Version Information**: Docker version and system details

### User Interface
- **Responsive Design**: Mobile-first responsive layout
- **Dark/Light Mode**: Theme switching support
- **Real-time Updates**: WebSocket-based live data updates
- **Filtering & Search**: Advanced container and host filtering

## 📁 Project Structure

```
apps/dockstat/
├── app/                    # React Router app directory
│   ├── routes/            # Route components and loaders
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utility functions and hooks
│   ├── styles/           # Global styles and themes
│   └── root.tsx          # App root component
├── build/                # Build output (generated)
├── public/               # Static assets
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # TailwindCSS configuration
└── package.json          # Package dependencies and scripts
```

## 🛠️ Development

### Setup

```bash
cd apps/dockstat
bun install
```

### Development Server

```bash
bun run dev
```

This starts the development server with:
- Hot module replacement
- TypeScript type checking
- Server-side rendering
- TailwindCSS compilation

### Building

```bash
bun run build
```

Creates optimized production build with:
- Minified assets
- Server bundle for SSR
- Static assets optimization
- Type checking validation

### Production Server

```bash
bun run start
```

Runs the production server using the built assets.

## 🎨 Styling

### TailwindCSS v4

The application uses TailwindCSS v4 with the Vite plugin for:
- **Utility-first CSS**: Rapid UI development
- **Custom Design System**: Consistent spacing, colors, and typography
- **Responsive Design**: Mobile-first breakpoints
- **Dark Mode**: Built-in dark mode support

### Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // Custom theme extensions
    },
  },
  plugins: [],
} satisfies Config
```

### Component Patterns

```typescript
// Example component with TailwindCSS
interface ContainerCardProps {
  container: Container;
  onAction: (action: string) => void;
}

export function ContainerCard({ container, onAction }: ContainerCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {container.name}
        </h3>
        <StatusBadge status={container.state} />
      </div>
      {/* Component content */}
    </div>
  );
}
```

## 🔄 Data Management

### React Router Loaders

```typescript
// Route loader example
export async function containerLoader({ params }: LoaderFunctionArgs) {
  const containerId = params.containerId;
  
  if (!containerId) {
    throw new Response("Container ID required", { status: 400 });
  }
  
  const container = await getContainer(containerId);
  return json({ container });
}

// Route component
export default function ContainerDetails() {
  const { container } = useLoaderData<typeof containerLoader>();
  
  return (
    <div>
      <h1>{container.name}</h1>
      {/* Container details */}
    </div>
  );
}
```

### Database Integration

The frontend integrates with the database layer through the `@dockstat/db` package:

```typescript
import { getContainers, getHosts } from '@dockstat/db';

// Fetch containers with filtering
const containers = await getContainers({
  host: 'production-host',
  state: 'running'
});

// Get host statistics
const hostStats = await getHosts();
```

### Real-time Updates

WebSocket integration for live data updates:

```typescript
// Custom hook for real-time container stats
function useContainerStats(containerId: string) {
  const [stats, setStats] = useState<ContainerStats | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/containers/${containerId}/stats`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStats(data);
    };
    
    return () => ws.close();
  }, [containerId]);
  
  return stats;
}
```

## 🧩 Component Architecture

### Layout Components

```typescript
// Main layout with navigation and sidebar
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Feature Components

```typescript
// Container list with filtering and actions
export function ContainerList() {
  const containers = useLoaderData<Container[]>();
  const [filter, setFilter] = useState<ContainerFilter>({});
  
  const filteredContainers = useMemo(() => {
    return containers.filter(container => 
      matchesFilter(container, filter)
    );
  }, [containers, filter]);
  
  return (
    <div>
      <ContainerFilter value={filter} onChange={setFilter} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContainers.map(container => (
          <ContainerCard key={container.id} container={container} />
        ))}
      </div>
    </div>
  );
}
```

### Utility Components

```typescript
// Reusable status badge
interface StatusBadgeProps {
  status: 'running' | 'stopped' | 'paused' | 'exited';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    running: 'bg-green-100 text-green-800',
    stopped: 'bg-red-100 text-red-800',
    paused: 'bg-yellow-100 text-yellow-800',
    exited: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
```

## 🚦 Routing

### Route Structure

```typescript
// Route configuration
export const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
        loader: dashboardLoader
      },
      {
        path: "containers",
        element: <ContainerList />,
        loader: containerListLoader
      },
      {
        path: "containers/:containerId",
        element: <ContainerDetails />,
        loader: containerLoader
      },
      {
        path: "hosts",
        element: <HostList />,
        loader: hostListLoader
      },
      {
        path: "hosts/:hostId",
        element: <HostDetails />,
        loader: hostLoader
      }
    ]
  }
];
```

### Navigation

```typescript
// Navigation component with active state
export function Navigation() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="px-6 py-4">
        <NavLink 
          to="/containers"
          className={({ isActive }) => 
            `px-3 py-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`
          }
        >
          Containers
        </NavLink>
        <NavLink 
          to="/hosts"
          className={({ isActive }) => 
            `px-3 py-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`
          }
        >
          Hosts
        </NavLink>
      </div>
    </nav>
  );
}
```

## 🔧 Configuration

### Vite Configuration

```typescript
// vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { tailwindcss } from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths()
  ],
  build: {
    target: "esnext"
  }
});
```

### TypeScript Configuration

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["app", "vite.config.ts"]
}
```

## 🧪 Testing

### Test Setup

```bash
bun add -D @testing-library/react @testing-library/jest-dom vitest
```

### Component Testing

```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContainerCard } from './ContainerCard';

describe('ContainerCard', () => {
  it('displays container name and status', () => {
    const container = {
      id: 'test-id',
      name: 'test-container',
      state: 'running'
    };
    
    render(<ContainerCard container={container} onAction={() => {}} />);
    
    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });
});
```

## 🚀 Deployment

### Production Build

```bash
bun run build
```

### Environment Variables

```bash
# Production configuration
NODE_ENV=production
DATABASE_URL=./production.db
API_BASE_URL=https://api.dockstat.com
WEBSOCKET_URL=wss://ws.dockstat.com
```

### Server Deployment

The application builds to both client and server bundles:

```
build/
├── client/           # Static assets for CDN
├── server/           # Server-side rendering bundle
└── server.js         # Production server entry
```

## 🔍 Debugging

### Development Tools

- React Developer Tools
- Vite Dev Server debugging
- TypeScript error overlay
- TailwindCSS IntelliSense

### Performance Monitoring

```typescript
// Performance measurement
import { performance } from 'perf_hooks';

function measureRender(WrappedComponent: React.ComponentType) {
  return function MeasuredComponent(props: any) {
    useEffect(() => {
      const start = performance.now();
      
      return () => {
        const end = performance.now();
        console.log(`Render time: ${end - start}ms`);
      };
    });
    
    return <WrappedComponent {...props} />;
  };
}
```

## 🤝 Contributing

### Development Workflow

1. Start development server: `bun run dev`
2. Make changes with hot reload
3. Run type checking: `bun run typecheck`
4. Build for production: `bun run build`
5. Test production build: `bun run start`

### Code Style

- Use TypeScript strict mode
- Follow React best practices
- Implement responsive design patterns
- Use semantic HTML elements
- Add proper ARIA attributes for accessibility

### Adding New Features

1. Create route components in `app/routes/`
2. Add corresponding loaders for data fetching
3. Implement UI components with TailwindCSS
4. Add type definitions in `@dockstat/typings`
5. Update navigation and routing configuration

The DockStat frontend provides a modern, responsive interface for Docker container management with real-time updates and comprehensive monitoring capabilities.