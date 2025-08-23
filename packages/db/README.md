# @dockstat/db

A TypeScript database layer focused on theme management and database access for Docker container monitoring. Built on top of `@dockstat/sqlite-wrapper` with predefined models for themes and seamless integration with `@dockstat/docker-client`.

## Features

- **Theme Management**: Store, retrieve, and manage UI themes with complex nested configurations
- **Database Access**: Provides underlying SQLite database access for integration with docker-client
- **Type Safety**: Full TypeScript support with proper type definitions
- **JSON Support**: Handles complex theme configurations with automatic JSON serialization
- **Persistence**: Themes and configurations persist across application restarts

## Installation

```bash
bun install @dockstat/db
```

## Usage

### Basic Setup

```typescript
import DockStatDB from "@dockstat/db";

const db = new DockStatDB();

// The database will automatically initialize with a default theme
const currentTheme = db.getCurrentTheme();
console.log(currentTheme.name); // "default"
```

### Theme Management

```typescript
// Add a custom theme
const customTheme = {
  name: "dark-theme",
  version: "1.0.0",
  creator: "YourName",
  license: "MIT",
  vars: {
    background_effect: {
      Solid: { color: "#1a1a1a" }
    },
    components: {
      Card: {
        accent: "#ffffff",
        border: true,
        border_size: 1,
        border_color: "#333333",
        title: {
          font: "Arial",
          color: "#ffffff",
          font_size: 14,
          font_weight: 600
        },
        // ... more component styles
      }
    }
  }
};

// Add the theme to the database
db.addOrUpdateTheme(customTheme);

// Set it as the current theme
db.setTheme("dark-theme");

// Get the current theme
const current = db.getCurrentTheme();
console.log(current.name); // "dark-theme"

// List all available themes
const allThemes = db.getThemes();
console.log(allThemes.map(t => t.name)); // ["default", "dark-theme"]
```

### Integration with Docker Client

The primary use case for this package is integration with `@dockstat/docker-client`:

```typescript
import DockStatDB from "@dockstat/db";
import DockerClient from "@dockstat/docker-client";

// Create database instance
const db = new DockStatDB();

// Pass the underlying DB to docker client
const dockerClient = new DockerClient(db.getDB(), {
  enableMonitoring: true,
  // ... other options
});

// DockStatDB handles themes, DockerClient handles hosts/containers
// They share the same SQLite database file
```

## API Reference

### Constructor

- `new DockStatDB()`: Creates a new database instance with automatic initialization

### Database Access

- `getDB()`: Returns the underlying sqlite-wrapper DB instance for integration
- `close()`: Closes the database connection
- `exec(sql: string)`: Execute raw SQL queries
- `getSchema()`: Get database schema information
- `getDatabasePath()`: Returns the database file path

### Theme Management

- `addOrUpdateTheme(theme: THEME_config)`: Add or update a theme
- `getTheme(themeName: string)`: Get a specific theme by name
- `getThemes()`: Get all available themes
- `setTheme(themeName: string)`: Set the current active theme
- `getCurrentTheme()`: Get the currently active theme
- `getCurrentThemeName()`: Get the current theme name

## Database Schema

The package creates the following tables:

### `config` table
- `id`: Primary key (always 1)
- `current_theme_name`: Name of the currently active theme

### `themes` table  
- `name`: Theme name (primary key)
- `version`: Theme version
- `creator`: Theme creator
- `license`: Theme license
- `vars`: Theme variables (stored as JSON)

### Integration Tables

When integrated with `@dockstat/docker-client`, additional tables are created:
- `hosts`: Managed by docker-client's HostHandler
- Other container/monitoring tables as needed

## Architecture

This package follows a separation of concerns:

- **DockStatDB**: Manages themes and provides database access
- **DockerClient**: Manages hosts, containers, and monitoring data  
- **Shared Database**: Both packages use the same SQLite file

The integration pattern:
1. Create DockStatDB instance
2. Pass `db.getDB()` to DockerClient constructor
3. Both packages operate on the same database
4. DockStatDB focuses on UI themes
5. DockerClient focuses on Docker operations

## Type Definitions

Theme configurations use the `THEME.THEME_config` type from `@dockstat/typings`, which supports:

- Multiple background effects (Solid, Gradient, Aurora)
- Component styling (Cards, etc.)
- Typography settings (font, size, weight, color)
- Border and spacing configurations

## Testing

```bash
bun run test
```

The test suite includes:
- Database initialization
- Theme CRUD operations  
- Persistence across instances
- Integration patterns
- Data serialization integrity

## 📄 License

Part of the DockStat monorepo - MIT License.