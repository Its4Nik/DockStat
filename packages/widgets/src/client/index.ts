/**
 * Client-side exports for the widgets package.
 *
 * Import from "widgets/client" to get types and hooks
 * without pulling in any server dependencies.
 */

// Runtime registry (pure data, safe for client import)
export {
  defaultDataFor,
  getNodeTemplate,
  NODE_KIND_META,
  NODE_TEMPLATES,
  templatesByKind,
} from "../server/data-pipe/registry"
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
  DataPipeNodeData,
  DataPipeNodeKind,
  FieldType,
  GridLayoutItem,
  ImportResult,
  ManifestAuthor,
  NodeKindMeta,
  NodeTemplateDef,
  PlacedWidget,
  PropertyField,
  WidgetConfig,
  WidgetDefinition,
  WidgetManifest,
} from "./types"
