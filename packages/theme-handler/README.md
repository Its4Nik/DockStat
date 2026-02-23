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

### Client Setup

```tsx
import {
  ThemeContext,
  applyThemeToDocument,
} from "@dockstat/theme-handler/client";
import {
  loadThemePreference,
  saveThemePreference,
} from "@dockstat/theme-handler/client";

// In your React component
function App() {
  const [theme, setTheme] = useState<ThemeContextData | null>(null);

  useEffect(() => {
    // Load saved theme or fetch from server
    const themeId = loadThemePreference();
    fetchTheme(themeId).then(setTheme);
  }, []);

  useEffect(() => {
    if (theme) {
      applyThemeToDocument(theme);
      saveThemePreference(theme.id);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      {/* Your app components */}
    </ThemeContext.Provider>
  );
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

#### ThemeContext

React context for theme data access throughout your component tree.

```typescript
import { ThemeContext } from "@dockstat/theme-handler/client";

function MyComponent() {
  const theme = useContext(ThemeContext);
  // Use theme variables...
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

### Theme Switching Component

```tsx
function ThemeSwitcher() {
  const [themes, setThemes] = useState<ThemeType[]>([]);
  const [currentTheme, setCurrentTheme] = useState<ThemeContextData | null>(
    null,
  );

  useEffect(() => {
    // Fetch available themes
    fetch("/themes")
      .then((r) => r.json())
      .then(setThemes);
  }, []);

  const handleThemeChange = (themeId: number) => {
    fetch(`/themes/${themeId}`)
      .then((r) => r.json())
      .then((theme) => {
        const contextData = {
          id: theme.id,
          vars: theme.variables,
        };
        setCurrentTheme(contextData);
        applyThemeToDocument(contextData);
        saveThemePreference(themeId);
      });
  };

  return (
    <select onChange={(e) => handleThemeChange(Number(e.target.value))}>
      {themes.map((theme) => (
        <option key={theme.id} value={theme.id}>
          {theme.name}
        </option>
      ))}
    </select>
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

Full TypeScript support is included:

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
