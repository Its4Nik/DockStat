# DockStat Frontend

The main frontend application for Docker container monitoring and management. Built with React Router v7 and modern web technologies.

## 🚀 Features

- **Real-time Monitoring**: Live Docker container statistics and metrics
- **Container Management**: Start, stop, restart, and manage Docker containers
- **Modern UI**: Responsive design with TailwindCSS
- **Theme Support**: Customizable themes from DockStore
- **Type Safety**: Full TypeScript support with shared types
- **Fast Development**: Hot Module Replacement (HMR) with Bun

## 🛠️ Tech Stack

- **Framework**: React Router v7
- **Runtime**: Bun
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Build Tool**: Vite
- **Linting**: Biome

## 🏁 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.2.17
- Node.js >= 18 (for some tooling)

### Development

```bash
# Install dependencies (from monorepo root)
bun install

# Start development server
bun run dev

# Or run from this directory
cd apps/dockstat
bun run dev
```

Your application will be available at `http://localhost:5173`.

### Building

```bash
# Build for production
bun run build

# Preview production build
bun run start
```

## 📁 Project Structure

```
apps/dockstat/
├── app/                   # React Router app directory
│   ├── components/        # Reusable React components
│   ├── routes/           # Route components and logic
│   ├── styles/           # CSS and styling files
│   └── root.tsx          # Root component
├── public/               # Static assets
├── build/                # Production build output
├── package.json          # App dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # TailwindCSS configuration
├── vite.config.ts        # Vite configuration
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
# API endpoints
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Feature flags
VITE_ENABLE_THEMES=true
VITE_ENABLE_PLUGINS=true
```

### TailwindCSS

Styling is handled by TailwindCSS with custom configuration for the DockStat design system. See `tailwind.config.js` for theme customization.

### TypeScript

The app uses strict TypeScript configuration and shared types from `@dockstat/typings`:

```typescript
import type { ContainerStats, DockerContainer } from '@dockstat/typings';
```

## 🔌 Integration

### Shared Packages

The app integrates with other monorepo packages:

```typescript
import { Database } from '@dockstat/db';
import { SQLiteWrapper } from '@dockstat/sqlite-wrapper';
import type { BaseConfig, ContainerStats } from '@dockstat/typings';
```

### API Communication

- RESTful API for container management
- WebSocket connections for real-time updates
- Integration with DockStatAPI backend

## 📦 Available Scripts

```bash
# Development
bun run dev          # Start development server with HMR
bun run build        # Build for production
bun run start        # Start production server

# Code Quality
bun run lint         # Lint code with Biome
bun run lint:fix     # Fix linting issues
bun run typecheck    # Type check with TypeScript

# Utilities
bun run clean        # Clean build artifacts
```

## 🎨 Theming

The app supports custom themes from DockStore:

1. Browse available themes in `apps/dockstore`
2. Install themes through the UI
3. Themes are applied dynamically via CSS custom properties

## 🚀 Deployment

### Docker

```bash
# Build Docker image
docker build -t dockstat-frontend .

# Run container
docker run -p 3000:3000 dockstat-frontend
```

### Static Hosting

The app builds to static files and can be deployed to:

- Vercel, Netlify, or similar platforms
- AWS S3 + CloudFront
- Any static file server

Make sure to configure proper routing for SPA:

```nginx
# nginx example
location / {
  try_files $uri $uri/ /index.html;
}
```

## 🤝 Contributing

1. Follow the monorepo contribution guidelines
2. Use conventional commits
3. Ensure all tests pass: `bun run test`
4. Run linting: `bun run lint:fix`
5. Type check: `bun run check-types`

## 📄 License

Part of the DockStat project - MIT License.
