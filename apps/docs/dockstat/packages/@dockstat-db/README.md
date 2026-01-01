---
id: 5176f3ba-1242-4c85-8290-491dcc0f9963
title: "@dockstat/db"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: bbcefaa2-6bd4-46e8-ae4b-a6b823593e67
updatedAt: 2026-01-01T14:25:48.724Z
urlId: LgnEA0nOUp
---

> A TypeScript database layer focused on theme management and database access for Docker container monitoring. Built on top of `@dockstat/sqlite-wrapper` with predefined models for themes and seamless integration with `@dockstat/docker-client`.

## Overview

`@dockstat/db` provides a high-level database abstraction for DockStat applications. It manages theme configurations, application settings, and serves as the central database coordinator for all DockStat packages.

```mermaidjs

graph TB
    subgraph "Application Layer"
        API["DockStat API"]
        FE["DockStat Frontend"]
    end

    subgraph "@dockstat/db"
        DOCKSTATDB["DockStatDB Class"]
        THEMES["Theme Manager"]
        CONFIG["Config Manager"]
        DEFAULTS["Default Data"]
    end

    subgraph "Dependencies"
        SW["@dockstat/sqlite-wrapper"]
        TYP["@dockstat/typings"]
    end

    subgraph "Consumers"
        DC["@dockstat/docker-client"]
        PH["@dockstat/plugin-handler"]
    end

    subgraph "Storage"
        SQLITE["SQLite Database"]
    end

    API --> DOCKSTATDB
    FE --> DOCKSTATDB
    DOCKSTATDB --> THEMES
    DOCKSTATDB --> CONFIG
    DOCKSTATDB --> DEFAULTS
    DOCKSTATDB --> SW
    DOCKSTATDB --> TYP
    DC --> DOCKSTATDB
    PH --> DOCKSTATDB
    SW --> SQLITE
```

## Installation

```bash
bun add @dockstat/db
```

## Quick Start

```typescript
import DockStatDB from "@dockstat/db";

// Initialize database (auto-creates with default theme)
const db = new DockStatDB();

// Get current theme
const theme = db.getCurrentTheme();
console.log(`Current theme: ${theme.name}`);

// Change theme
db.setTheme("dark-theme");

// Get underlying DB for other packages
const sqliteDb = db.getDB();
```

## Architecture

### Database Schema

```mermaidjs

erDiagram
    config {
        int id PK "Always 1 (singleton)"
        string current_theme_name FK "Active theme"
    }

    themes {
        string name PK "Theme identifier"
        string version "Semantic version"
        string creator "Theme author"
        string license "License type"
        json vars "Theme variables (JSON)"
    }

    config ||--o| themes : "references"
```

### Initialization Flow

```mermaidjs

sequenceDiagram
    participant App as "Application"
    participant DB as "DockStatDB"
    participant SW as "sqlite-wrapper"
    participant File as "SQLite File"

    App->>DB: "new DockStatDB()"
    DB->>SW: "new DB('dockstat.db')"
    SW->>File: "Open/Create database"
    
    DB->>DB: "Create config table"
    DB->>DB: "Create themes table"
    
    DB->>DB: "Check for default theme"
    alt "No default theme"
        DB->>DB: "Insert default theme"
        DB->>DB: "Set config to default"
    end
    
    DB-->>App: "DockStatDB instance"
```

## Core Features

### Theme Management

```mermaidjs

graph LR
    subgraph "Theme Operations"
        ADD["Add Theme"]
        GET["Get Theme"]
        SET["Set Active"]
        LIST["List Themes"]
        UPDATE["Update Theme"]
    end

    subgraph "Theme Structure"
        META["Metadata"]
        VARS["Variables"]
    end

    subgraph "Variables"
        BG["Background Effects"]
        COMP["Component Styles"]
        FONT["Font Config"]
    end

    ADD --> META
    ADD --> VARS
    VARS --> BG
    VARS --> COMP
    VARS --> FONT
```

#### Adding Themes

```typescript
import DockStatDB from "@dockstat/db";
import type { THEME } from "@dockstat/typings";

const db = new DockStatDB();

const customTheme: THEME.THEME_config = {
  name: "ocean-dark",
  version: "1.0.0",
  creator: "Developer",
  license: "MIT",
  description: "Ocean-inspired dark theme",
  active: false,
  vars: {
    background_effect: {
      Gradient: {
        from: "#0a1628",
        to: "#1a365d",
        direction: "to bottom right"
      }
    },
    components: {
      Card: {
        accent: "#3182ce",
        border: "1px solid #2c5282",
        border_color: "#2c5282",
        border_size: "1px",
        title: {
          font: "Inter",
          color: "#ffffff",
          font_size: "18px",
          font_weight: "600"
        },
        sub_title: {
          font: "Inter",
          color: "#a0aec0",
          font_size: "14px",
          font_weight: "400"
        },
        content: {
          font: "Inter",
          color: "#e2e8f0",
          font_size: "14px",
          font_weight: "400"
        }
      }
    }
  }
};

// Add or update theme
db.addOrUpdateTheme(customTheme);
```

#### Getting Themes

```typescript
// Get specific theme by name
const theme = db.getTheme("ocean-dark");

// Get all available themes
const allThemes = db.getThemes();
console.log(`Available themes: ${allThemes.map(t => t.name).join(", ")}`);

// Get currently active theme
const currentTheme = db.getCurrentTheme();

// Get just the current theme name
const themeName = db.getCurrentThemeName();
```

#### Setting Active Theme

```typescript
// Set theme by name
db.setTheme("ocean-dark");

// Verify the change
const current = db.getCurrentThemeName();
console.log(`Active theme is now: ${current}`);
```

### Database Access

The primary use case for `@dockstat/db` is providing database access to other DockStat packages:

```typescript
import DockStatDB from "@dockstat/db";
import DockerClient from "@dockstat/docker-client";
import PluginHandler from "@dockstat/plugin-handler";

// Create central database instance
const db = new DockStatDB();

// Share with Docker client
const dockerClient = new DockerClient(db.getDB(), {
  enableMonitoring: true
});

// Share with Plugin handler
const pluginHandler = new PluginHandler(db.getDB());

// All packages now use the same SQLite database
// - DockStatDB manages themes and config
// - DockerClient manages hosts and containers
// - PluginHandler manages plugins
```

### Configuration Management

```typescript
// The config table stores application-wide settings
// Currently tracks the active theme

// Internal structure (accessed via theme methods)
interface Config {
  id: number;              // Always 1
  current_theme_name: string;  // References themes.name
}
```

## Theme Structure

### Background Effects

Three types of background effects are supported:

```typescript
import type { THEME } from "@dockstat/typings";

// Solid color background
const solidBg: THEME.THEME_background_effects = {
  Solid: { color: "#1a1a2e" }
};

// Gradient background
const gradientBg: THEME.THEME_background_effects = {
  Gradient: {
    from: "#1a1a2e",
    to: "#16213e",
    direction: "to bottom right"
  }
};

// Aurora effect background
const auroraBg: THEME.THEME_background_effects = {
  Aurora: {
    colors: ["#1a1a2e", "#16213e", "#0f3460"],
    speed: "slow"
  }
};
```

### Component Styles

```typescript
import type { THEME } from "@dockstat/typings";

const componentStyles: THEME.THEME_components = {
  Card: {
    accent: "#0f3460",
    border: "1px solid #e94560",
    border_color: "#e94560",
    border_size: "1px",
    title: {
      font: "Inter",
      color: "#ffffff",
      font_size: "18px",
      font_weight: "600"
    },
    sub_title: {
      font: "Inter",
      color: "#cccccc",
      font_size: "14px",
      font_weight: "400"
    },
    content: {
      font: "Inter",
      color: "#e0e0e0",
      font_size: "14px",
      font_weight: "400"
    }
  }
  // Additional components can be added
};
```

### Font Configuration

```typescript
import type { THEME } from "@dockstat/typings";

const fontConfig: THEME.THEME_font_config = {
  font: "Inter",           // Font family
  color: "#ffffff",        // Text color
  font_size: "16px",       // Font size
  font_weight: "400"       // Font weight
};
```

## API Reference

### Constructor

```typescript
new DockStatDB(path?: string)
```

Creates a new DockStatDB instance. If no path is provided, defaults to `dockstat.db` in the current directory.

**Parameters:**

* `path` (optional): Path to the SQLite database file

**Example:**

```typescript
// Default path
const db = new DockStatDB();

// Custom path
const db = new DockStatDB("./data/myapp.db");
```

### Database Access Methods

| Method | Return Type | Description |
|----|----|----|
| `getDB()` | `DB` | Returns the underlying sqlite-wrapper DB instance |
| `close()` | `void` | Closes the database connection |
| `exec(sql)` | `any` | Execute raw SQL query |
| `getSchema()` | `object` | Get database schema information |
| `getDatabasePath()` | `string` | Returns the database file path |

### Theme Management Methods

| Method | Return Type | Description |
|----|----|----|
| `addOrUpdateTheme(theme)` | `void` | Add or update a theme |
| `getTheme(name)` | `THEME_config \| null` | Get theme by name |
| `getThemes()` | `THEME_config[]` | Get all themes |
| `setTheme(name)` | `void` | Set the active theme |
| `getCurrentTheme()` | `THEME_config` | Get the currently active theme |
| `getCurrentThemeName()` | `string` | Get the current theme name |

## Default Theme

The package includes a default theme that is automatically created on first initialization:

```typescript
const defaultTheme = {
  name: "default",
  version: "1.0.0",
  creator: "DockStat",
  license: "MIT",
  description: "Default DockStat theme",
  active: true,
  vars: {
    background_effect: {
      Solid: { color: "#1a1a1a" }
    },
    components: {
      Card: {
        accent: "#3b82f6",
        border: "1px solid #374151",
        border_color: "#374151",
        border_size: "1px",
        title: {
          font: "Inter",
          color: "#f9fafb",
          font_size: "18px",
          font_weight: "600"
        },
        sub_title: {
          font: "Inter",
          color: "#9ca3af",
          font_size: "14px",
          font_weight: "400"
        },
        content: {
          font: "Inter",
          color: "#e5e7eb",
          font_size: "14px",
          font_weight: "400"
        }
      }
    }
  }
};
```

## Usage Patterns

### Singleton Pattern

```typescript
// Recommended: Use a singleton for the entire application

class DatabaseService {
  private static instance: DockStatDB;

  static getInstance(): DockStatDB {
    if (!this.instance) {
      this.instance = new DockStatDB();
    }
    return this.instance;
  }
}

// Usage

const db = DatabaseService.getInstance();
```

### Theme Switching in Frontend

```typescript
import DockStatDB from "@dockstat/db";

const db = new DockStatDB();

// React/frontend integration
function useTheme() {
  const [theme, setTheme] = useState(db.getCurrentTheme());

  const changeTheme = (themeName: string) => {
    db.setTheme(themeName);
    setTheme(db.getCurrentTheme());
    applyThemeToDOM(db.getCurrentTheme());
  };

  return { theme, changeTheme };
}

function applyThemeToDOM(theme: THEME.THEME_config) {
  const root = document.documentElement;
  
  // Apply background
  const bg = theme.vars.background_effect;
  if ("Solid" in bg) {
    root.style.setProperty("--bg-color", bg.Solid.color);
  } else if ("Gradient" in bg) {
    root.style.setProperty("--bg-from", bg.Gradient.from);
    root.style.setProperty("--bg-to", bg.Gradient.to);
  }
  
  // Apply component styles
  const card = theme.vars.components.Card;
  root.style.setProperty("--card-accent", card.accent);
  root.style.setProperty("--card-border", card.border);
  root.style.setProperty("--card-title-color", card.title.color);
}
```

### Integration with Docker Client

```typescript
import DockStatDB from "@dockstat/db";
import DockerClient from "@dockstat/docker-client";

class AppServices {
  private db: DockStatDB;
  private dockerClient: DockerClient;

  constructor() {
    // DockStatDB creates and manages the database
    this.db = new DockStatDB();
    
    // DockerClient uses the same database for host storage
    this.dockerClient = new DockerClient(this.db.getDB(), {
      enableMonitoring: true
    });
  }

  getTheme() {
    return this.db.getCurrentTheme();
  }

  async getContainers(clientId: number) {
    return await this.dockerClient.getAllContainers(clientId);
  }

  cleanup() {
    this.db.close();
  }
}
```

## Error Handling

```typescript
import DockStatDB from "@dockstat/db";
import Logger from "@dockstat/logger";

const log = new Logger("Database");

try {
  const db = new DockStatDB();
  
  // Theme operations
  const theme = db.getTheme("nonexistent");
  if (!theme) {
    log.warn("Theme not found, using default");
    db.setTheme("default");
  }
  
} catch (error) {
  if (error.code === "SQLITE_CANTOPEN") {
    log.error("Cannot open database file");
  } else if (error.code === "SQLITE_CORRUPT") {
    log.error("Database is corrupted");
  } else {
    log.error(`Database error: ${error.message}`);
  }
}
```

## Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import DockStatDB from "@dockstat/db";
import { unlinkSync } from "fs";

describe("DockStatDB", () => {
  let db: DockStatDB;
  const testDbPath = "./test.db";

  beforeEach(() => {
    db = new DockStatDB(testDbPath);
  });

  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
      unlinkSync(`${testDbPath}-wal`);
      unlinkSync(`${testDbPath}-shm`);
    } catch {}
  });

  it("should initialize with default theme", () => {
    const theme = db.getCurrentTheme();
    expect(theme.name).toBe("default");
  });

  it("should add and retrieve custom theme", () => {
    db.addOrUpdateTheme({
      name: "test-theme",
      version: "1.0.0",
      creator: "Test",
      license: "MIT",
      vars: { /* ... */ }
    });

    const theme = db.getTheme("test-theme");
    expect(theme).not.toBeNull();
    expect(theme.name).toBe("test-theme");
  });

  it("should change active theme", () => {
    db.addOrUpdateTheme({
      name: "new-theme",
      version: "1.0.0",
      creator: "Test",
      license: "MIT",
      vars: { /* ... */ }
    });

    db.setTheme("new-theme");
    expect(db.getCurrentThemeName()).toBe("new-theme");
  });

  it("should persist data across instances", () => {
    db.addOrUpdateTheme({
      name: "persistent-theme",
      version: "1.0.0",
      creator: "Test",
      license: "MIT",
      vars: { /* ... */ }
    });
    db.setTheme("persistent-theme");
    db.close();

    const db2 = new DockStatDB(testDbPath);
    expect(db2.getCurrentThemeName()).toBe("persistent-theme");
    db2.close();
  });
});
```

## Related Packages

* `@dockstat/sqlite-wrapper` - Underlying SQLite operations
* `@dockstat/typings` - Theme and database type definitions
* `@dockstat/docker-client` - Uses db for host persistence
* `@dockstat/plugin-handler` - Uses db for plugin storage

## License

Part of the DockStat project - MIT License.

## Contributing

Issues and PRs welcome at [github.com/Its4Nik/DockStat](https://github.com/Its4Nik/DockStat)