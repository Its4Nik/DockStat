---
id: b4148ac3-5b60-4223-aa0d-48111649b91f
title: "@dockstat/theme-handler"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 75d80211-7262-4064-aaa6-2ead20e17f43
updatedAt: 2025-08-24T18:23:52.182Z
urlId: zqe3ITb7jc
---

## Overview

The theme-handler is a comprehensive theme management system for React applications that automatically converts theme configurations into CSS custom properties, enabling seamless theme switching with TypeScript support.

## Architecture

### Core Components

```
@dockstat/theme-handler/
├── index.ts                    # ThemeHandler database class (used by DockStat)
├── src/
│   ├── index.ts                # Main exports
│   ├── context.tsx             # React Context & base hook
│   ├── ThemeProvider.tsx       # Main provider component
│   ├── hooks.ts                # Utility hooks
│   ├── cssVariableParser.ts    # CSS variable generation
│   └── ThemeLoadingOverlay.tsx # Loading UI
```

## API Reference

### ThemeProvider

The main component that provides theme context to your application.

```tsx
interface ThemeProviderProps {
  children: React.ReactNode;

  // Theme Configuration
  initialThemeName?: string;           // Default: "default"
  initialTheme?: THEME.THEME_config;   // Preloaded theme object
  fallbackThemeName?: string;          // Default: "default"

  // Data Sources
  themeHandler?: ThemeHandler;         // Database handler instance
  apiEndpoint?: string;                // API base URL (e.g., "/api")
  apiHeaders?: Record<string, string>; // Additional headers

  // CSS Variable Configuration
  cssParserConfig?: Partial<CSSVariableParserConfig>;

  // UI Configuration
  showLoadingOverlay?: boolean;        // Default: true
  customLoadingContent?: React.ReactNode;
  customErrorContent?: React.ReactNode;

  // Event Handlers
  onThemeChange?: (name: string, theme: THEME.THEME_config | null) => void;
  onThemeLoadError?: (error: Error, themeName: string) => void;
  onThemeLoaded?: (themeName: string, theme: THEME.THEME_config) => void;

  // Retry Configuration
  retryAttempts?: number;              // Default: 3
  retryDelay?: number;                 // Default: 1000ms
}
```

#### Usage Examples

**API-based themes:**

```tsx
<ThemeProvider 
  apiEndpoint="/api"
  initialThemeName="light"
  apiHeaders={{ 'Authorization': 'Bearer token' }}
  onThemeChange={(name, theme) => console.log('Theme changed:', name)}
>
  <App />
</ThemeProvider>
```

**Database-based themes:**

```tsx
import DB from "@dockstat/sqlite-wrapper"
const db = new DB('themes.sqlite');
const themeHandler = new ThemeHandler(db);

<ThemeProvider 
  themeHandler={themeHandler}
  initialThemeName="dark"
>
  <App />
</ThemeProvider>
```

**Preloaded theme:**

```tsx
<ThemeProvider 
  initialTheme={myThemeObject}
  showLoadingOverlay={false}
>
  <App />
</ThemeProvider>
```

### Core Hooks

#### useTheme()

Returns the complete theme context.

```tsx
interface ThemeContextType {
  // Current State
  theme: THEME.THEME_config | null;    // Current theme object
  themeName: string;                   // Current theme name
  themeVars: Record<string, string>;   // Generated CSS variables
  
  // Loading States
  isLoading: boolean;                  // Loading indicator
  isThemeLoaded: boolean;             // Theme ready state
  error: string | null;               // Error message
  
  // Available Data
  availableThemes: string[];          // List of theme names
  
  // Actions
  setThemeName: (name: string) => void;
  refreshTheme: () => Promise<void>;
}

// Usage

const { theme, themeName, themeVars, isThemeLoaded, error } = useTheme();
```

#### useThemeSwitch()

Provides theme switching functionality with loading states.

```tsx
interface ThemeSwitchHook {
  switchTheme: (themeName: string) => Promise<void>;
  isSwitching: boolean;               // Currently switching
  switchingTo: string | null;         // Target theme name
  error: string | null;               // Switch error
}

// Usage

const { switchTheme, isSwitching, switchingTo } = useThemeSwitch();

await switchTheme('dark');
```

### Utility Hooks

#### useThemeVariable()

Get a specific CSS variable value with fallback.

```tsx
function useThemeVariable(
  variableName: string, 
  fallback?: string
): string | undefined

// Usage

const accentColor = useThemeVariable('theme-components-card-accent', '#007bff');
const bgColor = useThemeVariable('--theme-background-effect-solid-color');
```

#### useThemeVariables()

Get multiple CSS variables at once.

```tsx
function useThemeVariables(variableNames: string[]): Record<string, string | undefined>

// Usage

const vars = useThemeVariables([
  'theme-components-card-accent',
  'theme-components-card-border-color'
]);
// Returns: { 'theme-components-card-accent': '#007bff', ... }
```

#### useComponentTheme()

Get theme configuration for a specific component.

```tsx
function useComponentTheme<K extends keyof THEME.THEME_components>(
  componentName: K
): THEME.THEME_components[K] | null

// Usage

const cardStyles = useComponentTheme('Card');
// Returns: { accent: '#007bff', border: true, title: { color: '#333', ... }, ... }
```

#### useThemePersistence()

Automatically save/restore theme selection from localStorage.

```tsx
function useThemePersistence(storageKey?: string): {
  clearPersistedTheme: () => void;
}

// Usage

useThemePersistence('my-app-theme'); // Auto-saves theme changes
```

#### useSystemTheme()

Detect system dark/light mode preference.

```tsx
function useSystemTheme(): 'light' | 'dark'

// Usage

const systemPreference = useSystemTheme();
```

#### useThemeHealthCheck()

Monitor theme validity and detect issues.

```tsx
interface ThemeHealthStatus {
  isHealthy: boolean;
  issues: string[];      // Critical problems
  warnings: string[];    // Non-critical issues
}

function useThemeHealthCheck(): ThemeHealthStatus

// Usage

const { isHealthy, issues, warnings } = useThemeHealthCheck();
```

#### useCustomCSSProperties()

Map theme variables to custom CSS property names.

```tsx
function useCustomCSSProperties(
  mapping: Record<string, string>,
  prefix?: string
): void

// Usage

useCustomCSSProperties({
  'primary': 'theme-components-card-accent',
  'background': 'theme-background-effect-solid-color'
}, '--my-component');

// Creates: --my-component-primary, --my-component-background
```

## CSS Variable Parser

### Configuration Interface

```tsx
interface CSSVariableParserConfig {
  prefix: string;                                    // CSS variable prefix
  separator: string;                                 // Path separator
  transformKey?: (key: string, path: string[]) => string;
  transformValue?: (value: unknown, key: string, path: string[]) => string;
  shouldInclude?: (key: string, value: unknown, path: string[]) => boolean;
}
```

### Default Configuration

```tsx
const defaultParserConfig: CSSVariableParserConfig = {
  prefix: "--theme",
  separator: "-",
  transformKey: (key: string) =>
    key.toLowerCase().replace(/[A-Z_]/g, (match) =>
      match === "_" ? "-" : `-${match.toLowerCase()}`
    ),
  transformValue: (value: unknown) => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value ? "1" : "0";
    return String(value);
  },
  shouldInclude: (_key: string, value: unknown) => {
    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    );
  },
};
```

### Predefined Configurations

```tsx
import { parserConfigs } from '@dockstat/theme-handler';

// Standard (default)
parserConfigs.standard
// Output: --theme-components-card-accent

// Compact

parserConfigs.compact
// Output: --t-components-card-accent

// Verbose

parserConfigs.verbose  
// Output: --dockstat-theme__components__card__accent

// Components Only

parserConfigs.componentsOnly
// Only includes theme.vars.components.*
```

### Custom Configuration Example

```tsx
<ThemeProvider
  cssParserConfig={{
    prefix: "--my-app",
    separator: "__",
    transformKey: (key) => key.toUpperCase(),
    shouldInclude: (key, value) => key !== 'internal_prop'
  }}
>
  <App />
</ThemeProvider>
```

## ThemeHandler (Database Integration)

### Class Interface

```tsx
class ThemeHandler {
  constructor(DB: DB);

  // Theme Management
  addTheme(theme: THEME.THEME_config): QueryResult;
  getTheme(name: string): THEME.THEME_config | null;
  getAllThemes(): THEME.THEME_config[];
  getThemeNames(): string[];
  deleteTheme(name: string): QueryResult;
  updateTheme(name: string, updates: Partial<THEME.THEME_config>): QueryResult;
  
  // Active Theme Management
  getActiveTheme(): THEME.THEME_config | null;
  setActiveTheme(name: string): QueryResult;
  
  // Utilities
  themeExists(name: string): boolean;
}
```

### Database Schema

```sql
CREATE TABLE themes (
  name TEXT PRIMARY KEY NOT NULL UNIQUE,
  version TEXT NOT NULL,
  creator TEXT NOT NULL,
  license TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT 0,
  vars TEXT NOT NULL
);
```

### Usage Example

```tsx
import { DB } from '@dockstat/sqlite-wrapper';
import { ThemeHandler } from '@dockstat/theme-handler/core';

const db = new DB('themes.sqlite');
const themeHandler = new ThemeHandler(db);

// Add themes

themeHandler.addTheme({
  name: 'corporate',
  version: '1.0.0',
  creator: 'Design Team',
  license: 'MIT',
  description: 'Corporate theme',
  active: false,
  vars: { /* theme configuration */ }
});

// Get themes

const theme = themeHandler.getTheme('corporate');
const allThemes = themeHandler.getAllThemes();
const themeNames = themeHandler.getThemeNames();

// Set active theme

themeHandler.setActiveTheme('corporate');
const activeTheme = themeHandler.getActiveTheme();
```

## Theme Structure

### Type Definitions

```tsx
interface THEME_config {
  name: string;
  version: string;
  creator: string;
  license: string;
  description: string;
  active: boolean | 0 | 1;
  vars: THEME_vars;
}

interface THEME_vars {
  background_effect: THEME_background_effects;
  components: THEME_components;
}

// Background Effects

type THEME_background_effects = 
  | { Solid: { color: string } }
  | { Gradient: { from: string; to: string; direction: string } };

// Component Themes

interface THEME_components {
  Card: {
    accent: string;
    border: boolean;
    border_color: string;
    border_size: number;
    title: THEME_font_config;
    sub_title: THEME_font_config;
    content: THEME_font_config;
  };
  // ... other components
}

interface THEME_font_config {
  font: string;
  color: string;
  font_size: number;
  font_weight: number;
}
```

### Example Theme

```tsx
const exampleTheme: THEME.THEME_config = {
  name: "professional",
  version: "1.2.0",
  creator: "Design System Team",
  license: "MIT",
  description: "Professional dark theme with blue accents",
  active: false,
  vars: {
    background_effect: {
      Gradient: {
        from: "#1a1a2e",
        to: "#16213e",
        direction: "tl-br"
      }
    },
    components: {
      Card: {
        accent: "#0066cc",
        border: true,
        border_color: "rgba(255, 255, 255, 0.1)",
        border_size: 1,
        title: {
          font: "Inter, -apple-system, sans-serif",
          color: "#ffffff",
          font_size: 18,
          font_weight: 600
        },
        sub_title: {
          font: "Inter, -apple-system, sans-serif", 
          color: "rgba(255, 255, 255, 0.8)",
          font_size: 14,
          font_weight: 400
        },
        content: {
          font: "Inter, -apple-system, sans-serif",
          color: "rgba(255, 255, 255, 0.9)",
          font_size: 13,
          font_weight: 300
        }
      }
    }
  }
};
```

### Generated CSS Variables

The above theme generates these CSS variables:

```css
:root {
  --theme-background-effect-gradient-from: #1a1a2e;
  --theme-background-effect-gradient-to: #16213e;
  --theme-background-effect-gradient-direction: tl-br;
  --theme-components-card-accent: #0066cc;
  --theme-components-card-border: 1;
  --theme-components-card-border-color: rgba(255, 255, 255, 0.1);
  --theme-components-card-border-size: 1;
  --theme-components-card-title-font: Inter, -apple-system, sans-serif;
  --theme-components-card-title-color: #ffffff;
  --theme-components-card-title-font-size: 18;
  --theme-components-card-title-font-weight: 600;
  --theme-components-card-sub-title-font: Inter, -apple-system, sans-serif;
  --theme-components-card-sub-title-color: rgba(255, 255, 255, 0.8);
  --theme-components-card-sub-title-font-size: 14;
  --theme-components-card-sub-title-font-weight: 400;
  --theme-components-card-content-font: Inter, -apple-system, sans-serif;
  --theme-components-card-content-color: rgba(255, 255, 255, 0.9);
  --theme-components-card-content-font-size: 13;
  --theme-components-card-content-font-weight: 300;
}
```

## API Integration

### Required Endpoints

Your API must provide these endpoints:


:::info
`{PREFIX}` is adjustable

:::

#### GET `/{PREFIX}/themes`

Returns available theme names or theme objects.

**Response Format:**

```tsx
// Option 1: Array of names

string[]

// Option 2: Array of objects with name property  
Array<{ name: string; [key: string]: any }>
```

**Example:**

```json
["light", "dark", "high-contrast"]
```

#### GET `/{PREFIX}/themes/{name}`

Returns a complete theme object.

**Response Format:**

```tsx
THEME.THEME_config
```

**Example:**

```json
{
  "name": "dark",
  "version": "1.0.0",
  "creator": "Design Team",
  "license": "MIT",
  "description": "Dark theme",
  "active": false,
  "vars": {
    "background_effect": {
      "Solid": { "color": "#1a1a1a" }
    },
    "components": {
      "Card": {
        "accent": "#007bff",
        "border": true,
        "border_color": "#333",
        "border_size": 1,
        "title": {
          "font": "Arial, sans-serif",
          "color": "#ffffff",
          "font_size": 16,
          "font_weight": 600
        },
        "sub_title": {
          "font": "Arial, sans-serif",
          "color": "#cccccc", 
          "font_size": 14,
          "font_weight": 400
        },
        "content": {
          "font": "Arial, sans-serif",
          "color": "#eeeeee",
          "font_size": 12,
          "font_weight": 300
        }
      }
    }
  }
}
```

### Error Handling

The theme provider includes automatic error handling:

* **Network errors**: Automatic retry with exponential back off
* **404 errors**: Falls back to `fallbackThemeName`
* **Parse errors**: Calls `onThemeLoadError` callback
* **Validation errors**: Logged to console, triggers health check warnings

### Custom Headers

```tsx
<ThemeProvider
  apiEndpoint="/api"
  apiHeaders={{
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  }}
>
  <App />
</ThemeProvider>
```

## Performance Considerations

### CSS Variable Management

* CSS variables are applied/removed efficiently using `document.documentElement.style`
* Previous variables are cleaned up before applying new ones
* Variables persist across component unmounts to prevent flickering

### Theme Loading

* Themes are loaded asynchronously with loading states
* Failed requests trigger automatic retry with exponential backoff
* AbortController cancels previous requests when new ones start
* Available themes are cached after first load

### Memory Management

* Theme objects are stored in React context (single instance)
* CSS variable objects are recreated only when themes change
* Event listeners are properly cleaned up on unmount

## Error Handling & Debugging

### Error Types

```tsx
// Loading errors

onThemeLoadError={(error: Error, themeName: string) => {
  console.error(`Failed to load theme "${themeName}":`, error);
  // Handle error (show toast, fallback, etc.)
}}

// Network errors
// Parse errors  
// Validation errors
```

### Debug Mode

Enable debugging by checking the browser console for theme-related logs:

```tsx
// Theme changes

console.log('Theme changed to: themeName', themeObject);

// CSS variable generation

console.log('Generated CSS variables:', variables);

// Loading states

console.log('Theme loading...', themeName);
console.log('Theme loaded successfully:', themeName);
```

### Health Monitoring

```tsx
function ThemeMonitor() {
  const { isHealthy, issues, warnings } = useThemeHealthCheck();
  
  React.useEffect(() => {
    if (!isHealthy) {
      console.warn('Theme issues detected:', { issues, warnings });
    }
  }, [isHealthy, issues, warnings]);
  
  return null;
}
```

## Migration Guide

### From CSS-in-JS

```tsx
// Before: styled-components/emotion

const Card = styled.div`
  background: ${props => props.theme.cardBg};
  color: ${props => props.theme.cardText};
`;

// After: CSS variables

const Card = styled.div`
  background: var(--theme-components-card-background);
  color: var(--theme-components-card-title-color);
`;
```

### From Manual Theme Switching

```tsx
// Before: Manual state management

const [theme, setTheme] = useState('light');
const handleThemeChange = (newTheme) => {
  setTheme(newTheme);
  document.body.className = `theme-${newTheme}`;
};

// After: Theme handler

const { switchTheme } = useThemeSwitch();
const handleThemeChange = (newTheme) => {
  switchTheme(newTheme); // Automatic CSS variable updates
};
```

## Testing

### Unit Testing

```tsx
import { renderHook } from '@testing-library/react-hooks';
import { ThemeProvider, useTheme } from '@dockstat/theme-handler';

const wrapper = ({ children }) => (
  <ThemeProvider initialTheme={mockTheme}>
    {children}
  </ThemeProvider>
);

test('useTheme returns theme data', () => {
  const { result } = renderHook(() => useTheme(), { wrapper });
  
  expect(result.current.theme).toEqual(mockTheme);
  expect(result.current.isThemeLoaded).toBe(true);
  expect(Object.keys(result.current.themeVars)).toHaveLength(17);
});
```

### Integration Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

test('theme switching works', async () => {
  render(
    <ThemeProvider apiEndpoint="/api" initialThemeName="light">
      <ThemeSwitcher />
    </ThemeProvider>
  );
  
  fireEvent.click(screen.getByText('Switch to Dark'));
  
  await waitFor(() => {
    expect(screen.getByText('Current: dark')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

**Theme stuck on "Loading..."**

* Check API endpoints are responding correctly
* Verify theme object structure matches `THEME.THEME_config`
* Check browser console for network/parsing errors

**CSS variables not applying**

* Ensure theme contains valid primitive values (string/number/boolean)
* Check `cssParserConfig.shouldInclude` isn't filtering out needed values
* Verify CSS variable names in your stylesheets match generated ones

**Theme switching not working**

* Make sure `availableThemes` contains the target theme name
* Check `onThemeLoadError` for loading failures
* Verify API endpoints return correct theme objects

**Memory leaks**

* ThemeProvider cleans up automatically on unmount
* Custom event listeners should use cleanup functions
* Avoid storing theme objects in component state

### Performance Issues

**Slow theme switching**

* Enable loading overlays to improve perceived performance
* Preload frequently used themes
* Optimize theme object size by removing unused properties

**CSS variable conflicts**

* Use custom `prefix` in parser config to avoid naming collisions
* Consider `parserConfigs.verbose` for unique variable names
* Check for existing CSS variables in your codebase

## Best Practices

### Theme Design


1. **Keep themes consistent**: Use the same structure across all themes
2. **Use semantic naming**: Choose descriptive property names
3. **Limit nesting depth**: Avoid deeply nested theme objects
4. **Include fallbacks**: Provide default values for optional properties

### Component Design


1. **Use CSS variables in stylesheets**: Avoid JavaScript-based styling when possible
2. **Implement loading states**: Handle theme loading gracefully
3. **Cache theme data**: Use React.memo for theme-dependent components
4. **Test with multiple themes**: Ensure components work across all themes

### Performance


1. **Lazy load themes**: Load themes on demand rather than all at once
2. **Use theme persistence**: Save user preferences to avoid repeated loads
3. **Minimize theme objects**: Remove unused properties and nested objects
4. **Batch theme operations**: Group related theme changes together