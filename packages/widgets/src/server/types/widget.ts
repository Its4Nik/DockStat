/**
 * Core type definitions for widgets.
 *
 * A Widget is the smallest unit — it describes a single visual component
 * that can be placed on a Dashboard.  Widget definitions are stored in the
 * database and can be imported/exported as JSON manifests (or zip archives).
 */

// ── Runtime configuration of a placed widget instance ────────────────

export interface WidgetConfig {
  /** Arbitrary key-value pairs that the widget renderer interprets */
  [key: string]: unknown
}

// ── Widget Definition (stored in DB) ─────────────────────────────────

export interface WidgetDefinition {
  id: string
  /** Human-readable identifier used as a slug */
  name: string
  /** Display label */
  label: string
  /** Short description */
  description: string
  /** Widget category for grouping */
  category: string
  /** Version string (semver-ish) */
  version: string
  /** The widget kind — determines the renderer on the frontend */
  kind: string
  /** Default configuration applied when the widget is first placed */
  defaultConfig: WidgetConfig
  /**
   * JSON Schema describing the shape of `config` so the frontend can
   * render an appropriate settings panel.
   */
  configSchema: Record<string, unknown>
  /**
   * List of data-source keys this widget *consumes*.  These keys must
   * be satisfied by the data-pipe graph the dashboard provides.
   */
  dataInputs: string[]
  /**
   * The output data keys this widget *produces* (for downstream widgets).
   * Leave empty when the widget is a terminal / display-only widget.
   */
  dataOutputs: string[]
  /** Optional: module path or URL for the widget renderer bundle */
  rendererPath?: string
  /** Optional: small icon identifier or data-URI */
  icon?: string
  /** ISO-8601 timestamps */
  createdAt: string
  updatedAt: string
}

// ── Placed Widget Instance (on a Dashboard) ────────────────────────

export interface PlacedWidget {
  /** Unique placement id (scoped to a dashboard) */
  instanceId: string
  /** References a registered WidgetDefinition */
  widgetId: string
  /** User-overridden config (merged on top of defaultConfig) */
  config: WidgetConfig
  /**
   * react-grid-layout position/size descriptor.
   * Stored as JSON in the database.
   */
  gridLayout: GridLayoutItem
}

// ── react-grid-layout item (subset of the full RGL type) ─────────────

export interface GridLayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
}

// ── react-grid-layout breakpoint structure ───────────────────────────

export type BreakpointLayouts = Partial<
  Record<string, GridLayoutItem[]>
>

export interface DashboardLayout {
  /** lg breakpoint is required, others are optional */
  lg: GridLayoutItem[]
  md?: GridLayoutItem[]
  sm?: GridLayoutItem[]
  xs?: GridLayoutItem[]
  xxs?: GridLayoutItem[]
}
