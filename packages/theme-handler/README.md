# @dockstat/theme-handler

A comprehensive, database-backed theme management system for React applications with server-side support and persistent user preferences.

## Features

- **Database Storage**: Persistent theme storage with SQLite backend
- **Server API**: RESTful endpoints for theme management
- **React Integration**: Context provider and hooks for seamless React integration
- **CSS Variables**: Automatic CSS variable injection for dynamic theming
- **Persistent Preferences**: Local storage for user theme preferences
- **Default Themes**: Pre-built light, dark, OLED, and ultra-dark themes
- **TypeScript Support**: Full type safety throughout
- **Animation Support**: Theme-based CSS animations and transitions

## Installation

```bash
bun install @dockstat/theme-handler
```

## Quick Start

### Server Setup

```typescript
import { createThemeHandler } from "@dockstat/theme-handler/server";
import { Database } from "@dockstat/sqlite-wrapper";
import { Logger } from "@dockstat/logger";

// Initialize dependencies
const db = new Database();
const logger = new Logger();

// Create theme handler
const themeHandler = createThemeHandler({ db, logger });

// Add routes to your Elysia server
const app = new Elysia().use(themeHandler.getRoutes()).listen(3000);
```

### Client Setup (DockStat Pattern)

In DockStat, the theme context is provided via a custom `ThemeProvider` that handles theme fetching, persistence, and exposes a richer context value.

```tsx
import { ThemeProvider } from "./providers/theme"; // Custom provider from your app

export default function App() {
  return <ThemeProvider>{/* Your app components */}</ThemeProvider>;
}
```

## API Reference

### Server API

The package provides a complete REST API for theme management:

#### Endpoints

- `GET /themes` - List all themes
- `GET /themes/:id` - Get specific theme by ID
- `POST /themes` - Create new theme
- `PUT /themes/:id` - Update existing theme
- `DELETE /themes/:id` - Delete theme

#### Theme Structure

```typescript
interface ThemeType {
  id: number;
  name: string;
  variables: Record<string, string>;
  animations: Record<string, Record<string, string | number>>;
}
```

### Client API

#### Theme Context Usage

In DockStat, access the theme context via `ThemeProviderContext` for full control:

```tsx
import { useContext } from "react";
import { ThemeProviderContext } from "@/contexts/theme";

function MyComponent() {
  const themeCtx = useContext(ThemeProviderContext);

  // Access theme variables
  const themeVars = themeCtx.theme?.vars;

  // Switch theme by name or ID
  themeCtx.applyTheme("dark");
  themeCtx.applyThemeById(2);

  // Get all available themes
  useEffect(() => {
    themeCtx.getAllThemes();
  }, []);
}
```

#### applyThemeToDocument

Applies theme variables to the document as CSS variables.

```typescript
import { applyThemeToDocument } from "@dockstat/theme-handler/client";

applyThemeToDocument(theme, (message) => {
  console.log(message); // "Applied Theme 1"
});
```

#### Storage Utilities

Manage theme preferences in localStorage:

```typescript
import {
  saveThemePreference,
  loadThemePreference,
  clearThemePreference,
} from "@dockstat/theme-handler/client";

// Save theme preference
saveThemePreference(1);

// Load saved preference
const themeId = loadThemePreference();

// Clear preference
clearThemePreference();
```

## Default Themes

The package includes four professionally designed themes:

### Light Theme

Clean, modern light theme with neutral colors and subtle contrasts.

### Dark Theme

Elegant dark theme with Dracula-inspired color palette.

### OLED Theme

Optimized for OLED displays with true blacks and vibrant accents.

### Ultra Dark Theme

Ultra-dark variant for maximum contrast and battery efficiency.

### Usage Example

```typescript
import { LightTheme, DarkTheme } from "@dockstat/theme-handler/themes";

// Access theme variables
const lightBg = LightTheme["--color-main-bg"];
const darkBg = DarkTheme["--color-main-bg"];
```

## Advanced Usage

### Custom Theme Creation

```typescript
const customTheme = {
  name: "My Custom Theme",
  variables: {
    "--color-primary": "#ff6b6b",
    "--color-secondary": "#4ecdc4",
    "--color-background": "#f7f7f7",
  },
  animations: {
    "--animate-fade-in": {
      name: "fade-in",
      duration: "0.3s",
      timingFunction: "ease-out",
    },
  },
};

// Save to database
await themeHandler.getThemeDB().createTheme(customTheme);
```

### Theme Switching & Settings Example

In DockStat, theme switching and editing is handled via context methods and used in the settings page:

```tsx
import { useContext } from "react";
import { ThemeProviderContext } from "@/contexts/theme";

function SettingsPage() {
  const themeCtx = useContext(ThemeProviderContext);
  const colors = Object.entries(themeCtx.theme?.vars ?? {}).map(
    ([name, value]) => ({
      colorName: name,
      color: value,
    }),
  );

  return (
    <div>
      {/* Render color editor, theme switcher, etc. */}
      {colors.map(({ colorName, color }) => (
        <div key={colorName}>
          <span>{colorName}</span>
          <span style={{ background: color }}>{color}</span>
        </div>
      ))}
    </div>
  );
}
```

### Server-Side Rendering

For Next.js applications, you can fetch themes server-side:

```typescript
// pages/_app.tsx
import { createThemeHandler } from "@dockstat/theme-handler/server";

export async function getServerSideProps(context) {
  const themeHandler = createThemeHandler({ db, logger });
  const themeId = context.req.cookies.themeId || 1;
  const theme = themeHandler.getTheme({ id: themeId });

  return {
    props: {
      initialTheme: theme,
    },
  };
}
```

## Configuration

### Database Schema

The package automatically creates the required database table:

```sql
CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  variables TEXT NOT NULL, -- JSON string
  animations TEXT NOT NULL -- JSON string
)
```

### Environment Variables

```bash
# Database configuration (handled by @dockstat/sqlite-wrapper)
DATABASE_PATH=./themes.db

# Logger configuration (handled by @dockstat/logger)
LOG_LEVEL=info
```

## Examples

### Basic Theme Application

```typescript
import { createThemeHandler } from "@dockstat/theme-handler/server";
import { applyThemeToDocument } from "@dockstat/theme-handler/client";

// Server: Get theme
const theme = themeHandler.getTheme({ name: "dark" });

// Client: Apply theme
applyThemeToDocument({
  id: theme.id,
  vars: theme.variables,
});
```

### Theme-aware Component

```tsx
function ThemedButton() {
  const theme = useContext(ThemeContext);

  return (
    <button
      style={{
        backgroundColor: `var(--color-button-primary-bg)`,
        color: `var(--color-button-primary-text)`,
      }}
    >
      Click me
    </button>
  );
}
```

## TypeScript Support

Full TypeScript support is included.

The context value exposed by DockStat's ThemeProvider is:

```typescript
interface ThemeProviderData {
  theme: ThemeContextData | null;
  isLoading: boolean;
  error: Error | null;
  applyTheme: (themeName: string) => Promise<void>;
  applyThemeById: (themeId: number) => Promise<void>;
  themesList: ThemeListItem[] | null;
  getAllThemes: () => Promise<void>;
}
```

You can also import types:

```typescript
import type {
  themeType,
  ThemeContextData,
  ThemeRoutesType,
} from "@dockstat/theme-handler";
```

## Dependencies

- **React**: ^19.2.3
- **Elysia**: For server API routes
- **@dockstat/sqlite-wrapper**: Database abstraction
- **@dockstat/logger**: Logging utilities

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Build for production
bun run build

# Run tests
bun test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the DockStat monorepo and follows the project's licensing terms.

## Support

For issues and questions, please use the project's issue tracker or contact the maintainers.
