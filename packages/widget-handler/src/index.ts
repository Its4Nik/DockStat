/**
 * @dockstat/widget-handler
 *
 * Dynamic widget dashboard system for React with react-grid-layout and framer-motion.
 *
 * Features:
 * - Drag-and-drop widget placement
 * - Type-safe widget definitions
 * - Multiple data source adapters (REST, WebSocket, GraphQL, Mock)
 * - Export/Import as JSON/YAML
 * - Extensible widget registry
 * - Built-in widgets (Stats, LineChart, Gauge, Table, Text, Alert)
 */

// Context
export { DashboardProvider, useDashboard, useWidgetDataState } from "./context"
// Dashboard components
export {
  Dashboard,
  DashboardGrid,
  DashboardToolbar,
  WidgetConfigModal,
  WidgetDrawer,
  WidgetWrapper,
} from "./dashboard"
// Library utilities
export { DataSourceManager, dataSourceManager, RegisterWidget, WidgetRegistry } from "./lib"
// Core types
export * from "./types"

// Built-in widgets
export {
  alertWidget,
  builtinWidgets,
  gaugeWidget,
  lineChartWidget,
  statsWidget,
  tableWidget,
  textWidget,
} from "./widgets"
