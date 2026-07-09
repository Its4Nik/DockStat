/**
 * Client-side type re-exports.
 *
 * These types are safe to import on the client (no server-only
 * dependencies like Database, Logger, etc.).
 */

export type {
  BreakpointLayouts,
  DashboardLayout,
  GridLayoutItem,
  PlacedWidget,
  WidgetConfig,
  WidgetDefinition,
} from "../../server/types/widget"

export type {
  DashboardDefinition,
  DataPayload,
  DataPipeEdge,
  DataPipeGraph,
  DataPipeNode,
} from "../../server/types/dashboard"

export type {
  DashboardExportData,
  DashboardExportManifest,
  ImportResult,
  ManifestAuthor,
  WidgetManifest,
} from "../../server/types/manifest"
