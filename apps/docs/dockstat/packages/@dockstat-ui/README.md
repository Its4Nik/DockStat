---
id: a04555b5-b827-4441-ae20-9cad1a2be714
title: "@dockstat/ui"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: bbcefaa2-6bd4-46e8-ae4b-a6b823593e67
updatedAt: 2026-01-01T15:02:02.743Z
urlId: NXWduCaEB3
---

> A React component library for DockStat applications. Built with TypeScript, TailwindCSS, and designed for theme integration. Includes Storybook for component development and documentation.

## Overview

`@dockstat/ui` provides a comprehensive set of React components used across DockStat applications. The library is designed to work seamlessly with the DockStat theming system and follows consistent design patterns.

```mermaidjs

graph TB
    subgraph "Applications"
        DS["dockstat (Frontend)"]
        OTHER["Other Apps"]
    end

    subgraph "@dockstat/ui"
        COMPONENTS["Component Library"]
        STORIES["Storybook"]
        THEMES["Theme Integration"]
        UTILS["UI Utilities"]
    end

    subgraph "Component Categories"
        LAYOUT["Layout Components"]
        FORMS["Form Components"]
        DISPLAY["Display Components"]
        FEEDBACK["Feedback Components"]
        NAV["Navigation Components"]
    end

    subgraph "Dependencies"
        REACT["React"]
        TW["TailwindCSS"]
        TYP["@dockstat/typings"]
        UTIL["@dockstat/utils"]
    end

    DS --> COMPONENTS
    OTHER --> COMPONENTS
    COMPONENTS --> LAYOUT
    COMPONENTS --> FORMS
    COMPONENTS --> DISPLAY
    COMPONENTS --> FEEDBACK
    COMPONENTS --> NAV
    COMPONENTS --> REACT
    COMPONENTS --> TW
    THEMES --> TYP
    UTILS --> UTIL
```

## Installation

```bash
bun add @dockstat/ui
```

> **Note**: This is an internal package. Peer dependencies include React, TailwindCSS, and other DockStat packages.

## Quick Start

```tsx
import { Card, Button, Badge, Table } from "@dockstat/ui";

function Dashboard() {
  return (
    <Card title="Containers" subtitle="Running containers">
      <Table
        columns={[
          { key: "name", label: "Name" },
          { key: "status", label: "Status" }
        ]}
        data={[
          { name: "nginx", status: <Badge variant="success">Running</Badge> },
          { name: "redis", status: <Badge variant="warning">Paused</Badge> }
        ]}
      />
      <Button onClick={() => console.log("Refresh")}>
        Refresh
      </Button>
    </Card>
  );
}
```

## Component Architecture

```mermaidjs

graph LR
    subgraph "Component Structure"
        COMP["Component"]
        PROPS["Props Interface"]
        STYLES["Styles"]
        LOGIC["Logic/Hooks"]
    end

    subgraph "Styling Approach"
        TW["TailwindCSS Classes"]
        CSS_VARS["CSS Variables"]
        THEME["Theme Integration"]
    end

    subgraph "Output"
        JSX["JSX Element"]
        TYPES["TypeScript Types"]
    end

    COMP --> PROPS
    COMP --> STYLES
    COMP --> LOGIC
    STYLES --> TW
    STYLES --> CSS_VARS
    CSS_VARS --> THEME
    COMP --> JSX
    PROPS --> TYPES
```

## Components

### Layout Components

#### Card

A versatile container component for grouping related content.

```tsx
import { Card } from "@dockstat/ui";

// Basic card
<Card title="Container Stats">
  <p>CPU: 45%</p>
  <p>Memory: 256MB</p>
</Card>

// Card with subtitle
<Card title="nginx" subtitle="Web Server">
  <p>Status: Running</p>
</Card>

// Card with custom styling
<Card 
  title="Alert" 
  className="border-red-500"
  accent="#ef4444"
>
  <p>High CPU usage detected!</p>
</Card>
```

**Props:**

| Prop | Type | Default | Description |
|----|----|----|----|
| `title` | `string` | — | Card title |
| `subtitle` | `string` | — | Card subtitle |
| `children` | `ReactNode` | — | Card content |
| `className` | `string` | — | Additional CSS classes |
| `accent` | `string` | — | Accent color override |

#### Divider

A horizontal separator for content sections.

```tsx
import { Divider } from "@dockstat/ui";

<div>
  <p>Section 1</p>
  <Divider />
  <p>Section 2</p>
</div>

// With label
<Divider label="OR" />

// Custom styling
<Divider className="my-8" />
```

#### Modal

A dialog component for overlays and popups.

```tsx
import { Modal } from "@dockstat/ui";
import { useState } from "react";

function Example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
      >
        <p>Are you sure you want to proceed?</p>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </Modal>
    </>
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|----|----|----|----|
| `isOpen` | `boolean` | `false` | Controls modal visibility |
| `onClose` | `() => void` | — | Close handler |
| `title` | `string` | — | Modal title |
| `children` | `ReactNode` | — | Modal content |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Modal size |

### Form Components

#### Button

A customizable button component with multiple variants.

```tsx
import { Button } from "@dockstat/ui";

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>

// With icon
<Button icon={<RefreshIcon />}>Refresh</Button>
```

**Props:**

| Prop | Type | Default | Description |
|----|----|----|----|
| `variant` | `"primary" \| "secondary" \| "danger" \| "ghost"` | `"primary"` | Button style variant |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Button size |
| `disabled` | `boolean` | `false` | Disable button |
| `loading` | `boolean` | `false` | Show loading state |
| `icon` | `ReactNode` | — | Icon element |
| `onClick` | `() => void` | — | Click handler |
| `children` | `ReactNode` | — | Button text |

#### Form Inputs

```tsx
import { Input, Select, Checkbox, Switch } from "@dockstat/ui";

// Text input
<Input
  label="Container Name"
  placeholder="Enter name..."
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// Select dropdown
<Select
  label="Image"
  options={[
    { value: "nginx", label: "nginx:latest" },
    { value: "redis", label: "redis:alpine" }
  ]}
  value={image}
  onChange={setImage}
/>

// Checkbox
<Checkbox
  label="Enable monitoring"
  checked={monitoring}
  onChange={setMonitoring}
/>

// Toggle switch
<Switch
  label="Auto-restart"
  checked={autoRestart}
  onChange={setAutoRestart}
/>
```

#### Slider

A range input component for numeric values.

```tsx
import { Slider } from "@dockstat/ui";

<Slider
  label="CPU Limit"
  min={0}
  max={100}
  value={cpuLimit}
  onChange={setCpuLimit}
  suffix="%"
/>

<Slider
  label="Memory"
  min={128}
  max={8192}
  step={128}
  value={memory}
  onChange={setMemory}
  suffix="MB"
/>
```

### Display Components

#### Badge

A small label component for status indicators.

```tsx
import { Badge } from "@dockstat/ui";

// Variants
<Badge variant="success">Running</Badge>
<Badge variant="warning">Paused</Badge>
<Badge variant="danger">Stopped</Badge>
<Badge variant="info">Created</Badge>
<Badge variant="default">Unknown</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>

// With dot indicator
<Badge variant="success" dot>Active</Badge>
```

**Props:**

| Prop | Type | Default | Description |
|----|----|----|----|
| `variant` | `"success" \| "warning" \| "danger" \| "info" \| "default"` | `"default"` | Badge color variant |
| `size` | `"sm" \| "md"` | `"md"` | Badge size |
| `dot` | `boolean` | `false` | Show status dot |
| `children` | `ReactNode` | — | Badge text |

#### Table

A data table component with sorting and custom rendering.

```tsx
import { Table } from "@dockstat/ui";

const columns = [
  { key: "name", label: "Container", sortable: true },
  { key: "image", label: "Image" },
  { key: "status", label: "Status", render: (value) => (
    <Badge variant={value === "running" ? "success" : "warning"}>
      {value}
    </Badge>
  )},
  { key: "actions", label: "", render: (_, row) => (
    <Button size="sm" onClick={() => handleAction(row)}>
      Manage
    </Button>
  )}
];

const data = [
  { name: "nginx-proxy", image: "nginx:latest", status: "running" },
  { name: "redis-cache", image: "redis:alpine", status: "paused" }
];

<Table 
  columns={columns} 
  data={data}
  onRowClick={(row) => console.log("Clicked:", row)}
/>
```

**Props:**

| Prop | Type | Description |
|----|----|----|
| `columns` | `Column[]` | Column definitions |
| `data` | `T[]` | Table data array |
| `onRowClick` | `(row: T) => void` | Row click handler |
| `loading` | `boolean` | Show loading state |
| `emptyMessage` | `string` | Message when no data |

#### Link

A styled link component with router integration.

```tsx
import { Link } from "@dockstat/ui";

// Internal link (uses React Router)
<Link to="/containers">View Containers</Link>

// External link
<Link href="https://docs.docker.com" external>
  Docker Docs
</Link>

// Styled variants
<Link to="/settings" variant="muted">Settings</Link>
```

### Navigation Components

#### Navbar

A top navigation bar component.

```tsx
import { Navbar } from "@dockstat/ui";

<Navbar
  logo={<Logo />}
  items={[
    { label: "Dashboard", to: "/" },
    { label: "Containers", to: "/containers" },
    { label: "Images", to: "/images" },
    { label: "Settings", to: "/settings" }
  ]}
  actions={
    <Button size="sm" variant="ghost">
      <UserIcon />
    </Button>
  }
/>
```

### Feedback Components

#### HoverBubble

A tooltip-like component that appears on hover.

```tsx
import { HoverBubble } from "@dockstat/ui";

<HoverBubble content="Container is healthy and running">
  <Badge variant="success">Running</Badge>
</HoverBubble>

// With custom positioning
<HoverBubble 
  content="Click to view details" 
  position="bottom"
  delay={200}
>
  <span>Hover me</span>
</HoverBubble>
```

### Plugin Components

#### Extensions

Components for rendering plugin-provided UI elements.

```tsx
import { PluginSlot, PluginWidget } from "@dockstat/ui/Plugins";

// Render plugin content in a slot
<PluginSlot name="dashboard-widgets">
  {(plugins) => plugins.map(plugin => (
    <PluginWidget key={plugin.id} plugin={plugin} />
  ))}
</PluginSlot>
```

## Theme Integration

Components automatically integrate with the DockStat theming system:

```mermaidjs

graph TB
    subgraph "Theme System"
        DB["@dockstat/db"]
        THEME["Theme Config"]
    end

    subgraph "CSS Variables"
        BG["--bg-*"]
        CARD["--card-*"]
        BTN["--btn-*"]
        TEXT["--text-*"]
    end

    subgraph "Components"
        UI["@dockstat/ui Components"]
    end

    DB --> THEME
    THEME --> BG
    THEME --> CARD
    THEME --> BTN
    THEME --> TEXT
    BG --> UI
    CARD --> UI
    BTN --> UI
    TEXT --> UI
```

### Using Theme Variables

```typescript
// Components use CSS variables that map to theme settings

const Card = ({ children, ...props }) => (
  <div 
    className="rounded-lg p-4"
    style={{
      backgroundColor: "var(--card-bg)",
      borderColor: "var(--card-border-color)",
      color: "var(--card-text)"
    }}
    {...props}
  >
    {children}
  </div>
);
```

### Applying Themes

```typescript
import DockStatDB from "@dockstat/db";
import type { THEME } from "@dockstat/typings";

function applyTheme(theme: THEME.THEME_config) {
  const root = document.documentElement;
  
  // Background
  const bg = theme.vars.background_effect;
  if ("Solid" in bg) {
    root.style.setProperty("--bg-color", bg.Solid.color);
  } else if ("Gradient" in bg) {
    root.style.setProperty("--bg-from", bg.Gradient.from);
    root.style.setProperty("--bg-to", bg.Gradient.to);
    root.style.setProperty("--bg-direction", bg.Gradient.direction);
  }
  
  // Card component
  const card = theme.vars.components.Card;
  root.style.setProperty("--card-accent", card.accent);
  root.style.setProperty("--card-border", card.border);
  root.style.setProperty("--card-title-color", card.title.color);
  root.style.setProperty("--card-title-font", card.title.font);
  root.style.setProperty("--card-content-color", card.content.color);
}
```

## Storybook

The package includes Storybook for component development and documentation.

### Running Storybook

```bash
cd packages/ui

bun run storybook
# or
bun run dev
# Available at http://localhost:6006
```

### Writing Stories

```tsx
// src/stories/Button.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../components/Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger", "ghost"]
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"]
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button"
  }
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button"
  }
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  )
};
```

## Directory Structure

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Badge/
│   │   │   ├── Badge.tsx
│   │   │   └── index.ts
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   ├── Divider/
│   │   ├── Extensions/
│   │   ├── Forms/
│   │   ├── HoverBubble/
│   │   ├── Link/
│   │   ├── Modal/
│   │   ├── Navbar/
│   │   ├── Plugins/
│   │   ├── Slider/
│   │   ├── Table/
│   │   └── index.ts
│   ├── stories/
│   │   ├── Badge.stories.tsx
│   │   ├── Button.stories.tsx
│   │   └── ...
│   ├── themes/
│   │   └── default.css
│   ├── utils/
│   │   └── cn.ts
│   ├── welcome/
│   └── App.tsx
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Utility Functions

### Class Name Utility

```typescript

import { cn } from "@dockstat/ui/utils";

// Merge class names conditionally
const buttonClass = cn(
  "px-4 py-2 rounded",
  variant === "primary" && "bg-blue-500 text-white",
  variant === "secondary" && "bg-gray-200 text-gray-800",
  disabled && "opacity-50 cursor-not-allowed",
  className
);
```

## Development

### Setup

```bash
cd packages/ui

bun install
```

### Development Mode

```bash
# Run Storybook dev server

bun run dev

# Run Storybook

bun run storybook
```

### Building

```bash
bun run build
```

### Type Checking

```bash
bun run check-types
```

## Best Practices

### Component Design


1. **Props Interface**: Always define TypeScript interfaces for props
2. **Default Values**: Provide sensible defaults for optional props
3. **Accessibility**: Include ARIA attributes and keyboard support
4. **Composition**: Design components for composition over configuration

### Styling


1. **TailwindCSS**: Use Tailwind classes for styling
2. **CSS Variables**: Use theme variables for customizable properties
3. **Responsive**: Design mobile-first with responsive utilities
4. **Dark Mode**: Support both light and dark themes

### Performance


1. **Memoization**: Use `React.memo` for expensive components
2. **Lazy Loading**: Code-split large components
3. **Event Handlers**: Memoize callbacks with `useCallback`

## Related Packages

* `@dockstat/typings` - Type definitions including theme types
* `@dockstat/utils` - Shared utility functions
* `@dockstat/db` - Theme management and persistence

## License

Part of the DockStat project - See main repository for license information.

## Contributing

Issues and PRs welcome at [github.com/Its4Nik/DockStat](https://github.com/Its4Nik/DockStat)