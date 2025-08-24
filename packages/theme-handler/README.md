# @dockstat/theme-handler

A lightweight, powerful theme management system for React applications with automatic CSS variable generation and seamless theme switching.

## Features

- 🎨 **React Context Integration** - Easy theme provider and hooks
- 🔄 **Dynamic Theme Switching** - Runtime theme changes with loading states
- 📱 **CSS Variable Generation** - Automatic CSS custom properties
- 🗄️ **Database Integration** - SQLite storage with ThemeHandler
- 🎯 **TypeScript Support** - Fully typed interfaces
- 🌓 **System Theme Detection** - Auto dark/light mode

## Quick Start

### Installation

```bash
bun add @dockstat/theme-handler
# or
npm install @dockstat/theme-handler
```

### Basic Usage (Non TailwindCSS)

```tsx
import React from 'react';
import { ThemeProvider, useTheme, useThemeSwitch } from '@dockstat/theme-handler';

// 1. Wrap your app
function App() {
  return (
    <ThemeProvider
      apiEndpoint="/api"
      initialThemeName="light"
    >
      {/* Your layout */}
    </ThemeProvider>
  );
}

// 2. Use themes in components
function MyComponent() {
  const { theme, themeVars } = useTheme();
  const { switchTheme } = useThemeSwitch();

  return (
    <div style={{
      color: 'var(--theme-components-card-title-color)',
      backgroundColor: 'var(--theme-background-effect-solid-color)'
    }}>
      <button onClick={() => switchTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### Basic Usage (TailwindCSS)

First you need to setup TailwindCSS in your project. Follow the [official documentation](https://tailwindcss.com/docs/installation) to get started.

Then you have to define the colors mappings in the `tailwind.config.js` file:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--theme-components-card-accent)',
        bgSolid: 'var(--theme-background-effect-solid-color)',
        cardTitle: 'var(--theme-components-card-title-color)'
      },
    },
  },
};
```

Now you can use these tailwind vars instead of doing `bg-[var(--theme-background-effect-solid-color)]` or `text-[var(--theme-components-card-title-color)]` in tailwind.

### API Setup

Your API should provide:
- `GET /api/themes` - Returns array of theme names
- `GET /api/themes/{name}` - Returns theme object

### Theme Structure

```typescript
const theme = {
  name: "light",
  version: "1.0.0",
  creator: "Your Name",
  license: "MIT",
  description: "Light theme",
  active: false,
  vars: {
    background_effect: {
      Solid: { color: "#ffffff" }
    },
    components: {
      Card: {
        accent: "#007bff",
        border: true,
        border_color: "#e1e8ed",
        title: {
          color: "#333",
          font_size: 16
        }
      }
    }
  }
};
```

## CSS Variables

Theme values automatically become CSS custom properties:
- `theme.vars.components.Card.accent` → `--theme-components-card-accent`
- `theme.vars.background_effect.Solid.color` → `--theme-background-effect-solid-color`

## Hooks

- `useTheme()` - Access current theme and variables
- `useThemeSwitch()` - Switch themes with loading states
- `useThemeVariable(name)` - Get specific CSS variable
- `useComponentTheme('Card')` - Get component theme object
- `useSystemTheme()` - Detect system dark/light preference

## Database Integration

```tsx
import { ThemeHandler } from '@dockstat/theme-handler/core';
import { DB } from '@dockstat/sqlite-wrapper';

const db = new DB('themes.db');
const themeHandler = new ThemeHandler(db);

// Add themes
themeHandler.addTheme(myTheme);

// Use with provider
<ThemeProvider themeHandler={themeHandler}>
  <App />
</ThemeProvider>
```

## Documentation


## License

MPL 2.0
