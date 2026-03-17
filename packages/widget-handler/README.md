# @dockstat/widget-handler

A dynamic, type-safe widget dashboard system for React. Build customizable dashboards with drag-and-drop widgets, multiple data source adapters, and seamless JSON/YAML configuration export.

## Features

- 🎯 **Type-Safe Widgets** - Full TypeScript generics support for widget definitions, configurations, and data
- 🖱️ **Drag & Drop** - Intuitive widget placement with `react-grid-layout`
- ✨ **Smooth Animations** - Powered by `framer-motion` for polished transitions
- 🔌 **Data Source Adapters** - REST, Static, Mock, WebSocket, and GraphQL support
- 💾 **Export/Import** - Save and load dashboards as JSON or YAML
- 📦 **Extensible Registry** - Runtime widget registration with no rebuild required
- 🎨 **DockStat UI** - Uses `@dockstat/ui` components for consistent styling
- ↩️ **Undo/Redo** - Full history support for all dashboard operations

## Installation

```bash
bun add @dockstat/widget-handler
```

## Quick Start

```tsx
import { Dashboard } from "@dockstat/widget-handler"
import "@dockstat/ui/css" // Import base styles

function App() {
  return (
    <Dashboard
      initialConfig={{
        id: "my-dashboard",
        name: "My Dashboard",
        grid: { columns: 12, rowHeight: 60 },
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "1.0.0",
      }}
      onConfigChange={(config) => {
        console.log("Dashboard changed:", config)
      }}
    />
  )
}
```

## Core Concepts

### Widget Definition

Widgets are defined using the `WidgetDefinition` type with full generic support:

```tsx
import type { WidgetDefinition, WidgetComponentProps } from "@dockstat/widget-handler"

interface MyWidgetConfig {
  title: string
  showIcon: boolean
}

interface MyWidgetData {
  value: number
}

function MyWidget({ config, data, isLoading }: WidgetComponentProps<MyWidgetConfig, MyWidgetData>) {
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      <h3>{config.title}</h3>
      <p>Value: {data?.value}</p>
    </div>
  )
}

export const myWidget: WidgetDefinition<MyWidgetConfig, MyWidgetData> = {
  type: "my-widget",
  name: "My Widget",
  description: "A custom widget",
  icon: "🎨",
  category: "Custom",
  defaultConfig: {
    title: "My Widget",
    showIcon: true,
  },
  defaultLayout: {
    x: 0,
    y: 0,
    w: 4,
    h: 2,
    minW: 2,
    minH: 2,
  },
  defaultDataSource: {
    type: "mock",
    generator: "random",
    interval: 5000,
  },
  component: MyWidget,
}
```

### Widget Registry

Register custom widgets at runtime:

```tsx
import { WidgetRegistry } from "@dockstat/widget-handler"
import { myWidget } from "./my-widget"

// Register a single widget
WidgetRegistry.register(myWidget)

// Register multiple widgets
WidgetRegistry.registerAll([widget1, widget2, widget3])

// Get a widget definition
const definition = WidgetRegistry.get("my-widget")

// Search widgets
const results = WidgetRegistry.search("chart")

// Get widgets by category
const chartWidgets = WidgetRegistry.getByCategory("Charts")
```

### Data Sources

Configure data sources for widgets using discriminated unions:

```tsx
// REST API
const restSource = {
  type: "rest",
  url: "https://api.example.com/metrics",
  method: "GET",
  headers: { Authorization: "Bearer token" },
  refreshInterval: 10000,
}

// Static Data
const staticSource = {
  type: "static",
  data: { value: 42, label: "Answer" },
}

// Mock Generator
const mockSource = {
  type: "mock",
  generator: "sin", // "random" | "increment" | "sin" | "sawtooth" | "square"
  interval: 1000,
  config: {
    min: 0,
    max: 100,
    period: 10000,
  },
}
```

### Dashboard Context

Access dashboard state and actions with hooks:

```tsx
import { useDashboard, useWidgetDataState } from "@dockstat/widget-handler"

function MyComponent() {
  const {
    state,
    addWidget,
    removeWidget,
    updateWidget,
    selectWidget,
    undo,
    redo,
    exportDashboard,
    importDashboard,
  } = useDashboard()

  const selectedWidget = state.config.widgets.find(
    (w) => w.id === state.selectedWidgetId
  )

  return (
    <div>
      <button onClick={() => addWidget("stats")}>Add Stats Widget</button>
      <button onClick={undo} disabled={state.history.past.length === 0}>
        Undo
      </button>
      <button onClick={redo} disabled={state.history.future.length === 0}>
        Redo
      </button>
    </div>
  )
}

// Get data state for a specific widget
function WidgetDataDisplay({ widgetId }: { widgetId: string }) {
  const dataState = useWidgetDataState(widgetId)
  
  if (dataState?.status === "loading") return <Spinner />
  if (dataState?.status === "error") return <Error message={dataState.error?.message} />
  
  return <DataDisplay data={dataState?.data} />
}
```

## Built-in Widgets

### 📊 Stats Widget
Display key metrics with optional trend indicators.

```tsx
import { statsWidget } from "@dockstat/widget-handler"

// Configuration
{
  label: "CPU Usage",
  unit: "%",
  decimals: 1,
  showTrend: true,
  thresholds: {
    warning: 70,
    critical: 90,
  },
}
```

### 📈 Line Chart Widget
Visualize time series data.

```tsx
import { lineChartWidget } from "@dockstat/widget-handler"

// Configuration
{
  title: "Memory Usage Over Time",
  lineColor: "var(--color-primary)",
  fillArea: true,
  showGrid: true,
  showPoints: false,
  smooth: true,
}
```

### 🎯 Gauge Widget
Display progress or value within a range.

```tsx
import { gaugeWidget } from "@dockstat/widget-handler"

// Configuration
{
  label: "Disk Usage",
  min: 0,
  max: 100,
  unit: "%",
  showPercentage: true,
  thresholds: {
    warning: 70,
    critical: 90,
  },
}
```

### 📋 Table Widget
Display data in tabular format.

```tsx
import { tableWidget } from "@dockstat/widget-handler"

// Configuration
{
  title: "Active Processes",
  columns: [
    { key: "name", title: "Name" },
    { key: "cpu", title: "CPU %", align: "right", format: "number" },
    { key: "status", title: "Status" },
  ],
  pageSize: 10,
  showRowNumbers: false,
  stickyHeader: true,
}
```

### 📝 Text Widget
Display formatted text content.

```tsx
import { textWidget } from "@dockstat/widget-handler"

// Configuration
{
  content: "Welcome to DockStat Dashboard!",
  fontSize: "lg",
  align: "center",
  background: "subtle",
}
```

### ⚠️ Alert Widget
Display alert messages with severity levels.

```tsx
import { alertWidget } from "@dockstat/widget-handler"

// Configuration
{
  title: "System Alert",
  message: "Memory usage exceeds 90%",
  severity: "warning", // "info" | "warning" | "error" | "success"
  showIcon: true,
  dismissible: true,
}
```

## Creating Custom Widgets

### Step 1: Define the Widget

```tsx
// widgets/TemperatureWidget.tsx
import type { WidgetDefinition, WidgetComponentProps } from "@dockstat/widget-handler"
import { Card, CardBody } from "@dockstat/ui"

interface TemperatureConfig {
  unit: "celsius" | "fahrenheit"
  location: string
  showHumidity: boolean
}

interface TemperatureData {
  temperature: number
  humidity: number
  lastUpdated: string
}

function TemperatureWidget({
  config,
  data,
  isLoading,
}: WidgetComponentProps<TemperatureConfig, TemperatureData>) {
  const temp = data?.temperature ?? 0
  const displayTemp = config.unit === "fahrenheit"
    ? (temp * 9/5) + 32
    : temp

  return (
    <Card className="h-full">
      <CardBody>
        <div className="text-sm text-muted-text">{config.location}</div>
        <div className="text-3xl font-bold">
          {isLoading ? "..." : `${displayTemp.toFixed(1)}°${config.unit === "fahrenheit" ? "F" : "C"}`}
        </div>
        {config.showHumidity && data?.humidity !== undefined && (
          <div className="text-sm text-muted-text">
            Humidity: {data.humidity}%
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export const temperatureWidget: WidgetDefinition<TemperatureConfig, TemperatureData> = {
  type: "temperature",
  name: "Temperature",
  description: "Display temperature and humidity for a location",
  icon: "🌡️",
  category: "Weather",
  tags: ["temperature", "weather", "humidity"],
  defaultConfig: {
    unit: "celsius",
    location: "New York",
    showHumidity: true,
  },
  defaultLayout: {
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    minW: 2,
    minH: 2,
  },
  defaultDataSource: {
    type: "rest",
    url: "https://api.weather.example.com/current",
    refreshInterval: 300000, // 5 minutes
  },
  configSchema: {
    fields: [
      {
        name: "unit",
        type: "select",
        label: "Temperature Unit",
        options: [
          { label: "Celsius", value: "celsius" },
          { label: "Fahrenheit", value: "fahrenheit" },
        ],
      },
      {
        name: "location",
        type: "text",
        label: "Location",
        required: true,
      },
      {
        name: "showHumidity",
        type: "boolean",
        label: "Show Humidity",
      },
    ],
  },
  component: TemperatureWidget,
}
```

### Step 2: Register the Widget

```tsx
import { WidgetRegistry } from "@dockstat/widget-handler"
import { temperatureWidget } from "./widgets/TemperatureWidget"

// Register before rendering the Dashboard
WidgetRegistry.register(temperatureWidget)
```

## Dashboard Configuration

### Grid Configuration

```tsx
const gridConfig = {
  columns: 12,          // Number of grid columns
  rowHeight: 60,        // Height of each row in pixels
  gap: 16,              // Gap between widgets in pixels
  compact: "vertical",  // "vertical" | "horizontal" | false
  preventCollision: false,
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
  },
}
```

### Dashboard Settings

```tsx
const settings = {
  refreshInterval: 30000,      // Global refresh interval
  editMode: true,              // Start in edit mode
  showBorders: true,           // Show widget borders
  theme: {
    colorScheme: "dark",       // "light" | "dark" | "system"
  },
}
```

### Widget Instance

```tsx
const widgetInstance = {
  id: "stats-123",
  type: "stats",
  config: {
    label: "CPU Usage",
    unit: "%",
    showTrend: true,
  },
  layout: {
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    minW: 2,
    minH: 2,
  },
  dataSource: {
    type: "mock",
    generator: "random",
  },
  title: "Custom Title",  // Override default title
  visible: true,
}
```

## Export & Import

### Export Dashboard

```tsx
const { exportDashboard } = useDashboard()

// Export as JSON
const json = exportDashboard()
console.log(json)

// Export as YAML
import YAML from "yaml"
const yaml = YAML.stringify(JSON.parse(json))
```

### Import Dashboard

```tsx
const { importDashboard } = useDashboard()

// From JSON
importDashboard(jsonString)

// From YAML
import YAML from "yaml"
const parsed = YAML.parse(yamlString)
importDashboard(JSON.stringify(parsed))
```

### Export Format

```json
{
  "version": "1.0.0",
  "exportedAt": "2025-01-15T10:30:00.000Z",
  "dashboard": {
    "id": "dashboard-123",
    "name": "My Dashboard",
    "grid": {
      "columns": 12,
      "rowHeight": 60
    },
    "widgets": [...],
    "settings": {...}
  }
}
```

## API Reference

### Exports

```tsx
// Main component
export { Dashboard } from "./dashboard"

// Dashboard components
export { DashboardGrid, DashboardToolbar, WidgetDrawer, WidgetWrapper } from "./dashboard"

// Context hooks
export { DashboardProvider, useDashboard, useWidgetDataState } from "./context"

// Library utilities
export { WidgetRegistry, RegisterWidget, DataSourceManager, dataSourceManager } from "./lib"

// Built-in widgets
export {
  statsWidget,
  lineChartWidget,
  gaugeWidget,
  tableWidget,
  textWidget,
  alertWidget,
  builtinWidgets,
} from "./widgets"

// Types
export type {
  WidgetDefinition,
  WidgetComponentProps,
  WidgetInstance,
  WidgetLayout,
  DataSourceConfig,
  DashboardConfig,
  DashboardState,
  DashboardAction,
  // ... and more
} from "./types"
```

### Subpath Exports

```tsx
// Main export
import { Dashboard } from "@dockstat/widget-handler"

// Types only
import type { WidgetDefinition } from "@dockstat/widget-handler/types"

// Widgets only
import { statsWidget } from "@dockstat/widget-handler/widgets"

// Dashboard components
import { DashboardGrid } from "@dockstat/widget-handler/dashboard"

// Context
import { useDashboard } from "@dockstat/widget-handler/context"

// Library utilities
import { WidgetRegistry } from "@dockstat/widget-handler/lib"
```

## Examples

### Basic Dashboard

```tsx
import { Dashboard } from "@dockstat/widget-handler"
import "@dockstat/ui/css"

export function BasicDashboard() {
  return <Dashboard />
}
```

### Dashboard with Initial Config

```tsx
import { Dashboard } from "@dockstat/widget-handler"
import "@dockstat/ui/css"

const initialConfig = {
  id: "monitoring-dashboard",
  name: "Server Monitoring",
  grid: { columns: 12, rowHeight: 60 },
  widgets: [
    {
      id: "cpu-stats",
      type: "stats",
      config: { label: "CPU", unit: "%" },
      layout: { x: 0, y: 0, w: 3, h: 2 },
    },
    {
      id: "memory-gauge",
      type: "gauge",
      config: { label: "Memory", min: 0, max: 100 },
      layout: { x: 3, y: 0, w: 3, h: 2 },
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  version: "1.0.0",
}

export function MonitoringDashboard() {
  return (
    <Dashboard
      initialConfig={initialConfig}
      onConfigChange={(config) => {
        // Save to backend
        fetch("/api/dashboard", {
          method: "PUT",
          body: JSON.stringify(config),
        })
      }}
    />
  )
}
```

### Standalone Widget Usage

```tsx
import { statsWidget, WidgetRegistry } from "@dockstat/widget-handler"

// Create a widget instance
const instance = WidgetRegistry.createInstance("stats", {
  config: { label: "Requests/sec" },
  layout: { x: 0, y: 0, w: 3, h: 2 },
})

console.log(instance)
// {
//   id: "stats-1705312345678-abc123",
//   type: "stats",
//   config: { label: "Requests/sec", ... },
//   layout: { x: 0, y: 0, w: 3, h: 2 },
//   ...
// }
```

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines in the main repository.
