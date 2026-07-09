/**
 * Client-side exports for the widgets package.
 *
 * Import from "widgets/client" to get types and hooks
 * without pulling in any server dependencies.
 */

export type { UseWidgetDataOptions, UseWidgetDataReturn } from "./hooks"
export { useWidgetData } from "./hooks"
export type {
  BreakpointLayouts,
  DashboardDefinition,
  DashboardExportData,
  DashboardExportManifest,
  DashboardLayout,
  DataPayload,
  DataPipeEdge,
  DataPipeGraph,
  DataPipeNode,
  GridLayoutItem,
  ImportResult,
  ManifestAuthor,
  PlacedWidget,
  WidgetConfig,
  WidgetDefinition,
  WidgetManifest,
} from "./types"
