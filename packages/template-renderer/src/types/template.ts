/**
 * Template Schema Types
 *
 * Defines the structure for JSON/YAML templates that describe frontend pages
 * composed of widgets from @dockstat/ui
 */

import type { WidgetType, WidgetRegistry, WidgetBindings, WidgetActions } from "./widgets"

/**
 * Base widget node definition
 * Represents a single widget in the template tree
 */
export interface WidgetNodeBase<T extends WidgetType = WidgetType> {
  /** Unique identifier for this widget instance */
  id?: string
  /** The type of widget to render */
  type: T
  /** Props to pass to the widget component */
  props: WidgetRegistry[T]
  /** Child widgets (for container widgets) */
  children?: WidgetNode[]
  /** Data bindings - maps prop names to data paths */
  bindings?: WidgetBindings
  /** Action handlers - maps event names to action identifiers */
  actions?: WidgetActions
  /** Conditional rendering expression */
  condition?: string
  /** Loop rendering - repeats this widget for each item in the bound array */
  loop?: {
    /** Data path to the array to iterate */
    items: string
    /** Variable name for current item in loop */
    itemVar?: string
    /** Variable name for current index in loop */
    indexVar?: string
    /** Key expression for React list rendering */
    keyExpr?: string
  }
}

/**
 * Type-safe widget node that enforces props match the widget type
 */
export type WidgetNode = {
  [K in WidgetType]: WidgetNodeBase<K>
}[WidgetType]

/**
 * Helper type to create a widget node with type inference
 */
export type TypedWidgetNode<T extends WidgetType> = WidgetNodeBase<T>

/**
 * Layout configuration for the page
 */
export interface LayoutConfig {
  /** CSS class to apply to the root container */
  className?: string
  /** Layout type */
  type?: "flex" | "grid" | "block"
  /** Flex direction when type is flex */
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  /** Gap between widgets */
  gap?: string | number
  /** Padding */
  padding?: string | number
  /** Max width constraint */
  maxWidth?: string | number
  /** Center the content horizontally */
  centered?: boolean
  /** Grid columns when type is grid */
  columns?: number | string
  /** Grid rows when type is grid */
  rows?: number | string
}

/**
 * State definition for the template
 */
export interface StateConfig {
  /** Initial state values */
  initial: Record<string, unknown>
  /** Computed values derived from state */
  computed?: Record<string, string>
}

/**
 * Action definition that can be triggered by widgets
 */
export interface ActionConfig {
  /** Unique identifier for this action */
  id: string
  /** Type of action */
  type: "navigate" | "setState" | "custom"
  /** Navigation path for navigate type */
  path?: string
  /** State updates for setState type */
  stateUpdates?: Record<string, unknown>
  /** Custom handler identifier */
  handler?: string
}

/**
 * Complete page template definition
 */
export interface PageTemplate {
  /** Unique identifier for this template */
  id: string
  /** Display name for the page */
  name: string
  /** Optional description */
  description?: string
  /** Template version for compatibility checking */
  version?: string
  /** Layout configuration for the root container */
  layout?: LayoutConfig
  /** Initial state and computed values */
  state?: StateConfig
  /** Actions that can be triggered */
  actions?: ActionConfig[]
  /** Root widgets to render */
  widgets: WidgetNode[]
  /** Metadata for the page (e.g., title, meta tags) */
  meta?: {
    title?: string
    description?: string
    [key: string]: unknown
  }
}

/**
 * Partial template for template fragments/components
 */
export interface TemplateFragment {
  /** Unique identifier for this fragment */
  id: string
  /** Display name */
  name: string
  /** Description */
  description?: string
  /** Props that can be passed to this fragment */
  props?: Record<
    string,
    {
      type: "string" | "number" | "boolean" | "object" | "array"
      required?: boolean
      default?: unknown
    }
  >
  /** Widgets in this fragment */
  widgets: WidgetNode[]
}

/**
 * Reference to a template fragment
 */
export interface FragmentReference {
  /** Type indicator for fragment references */
  type: "fragment"
  /** Fragment ID to reference */
  fragmentId: string
  /** Props to pass to the fragment */
  props?: Record<string, unknown>
}

/**
 * Union type for widget nodes and fragment references
 */
export type TemplateNode = WidgetNode | FragmentReference

/**
 * Check if a template node is a fragment reference
 */
export function isFragmentReference(node: TemplateNode): node is FragmentReference {
  return "type" in node && node.type === "fragment" && "fragmentId" in node
}

/**
 * Plugin frontend route configuration
 * Used to define a route that renders a template
 */
export interface PluginFrontendRoute {
  /** Route path (e.g., "/dashboard", "/settings") */
  path: string
  /** Static template definition */
  template?: PageTemplate
  /** Template fragments available for this route */
  fragments?: TemplateFragment[]
  /** Route metadata */
  meta?: {
    title?: string
    icon?: string
    showInNav?: boolean
    navOrder?: number
    [key: string]: unknown
  }
}

/**
 * Plugin frontend configuration
 * Added to plugin config for frontend functionality
 */
export interface PluginFrontendConfig {
  /** Frontend routes provided by this plugin */
  routes?: PluginFrontendRoute[]
  /** Shared fragments available to all routes */
  sharedFragments?: TemplateFragment[]
  /** Global state shared across routes */
  globalState?: StateConfig
}

/**
 * Template rendering context
 * Passed to the renderer with runtime data and handlers
 */
export interface TemplateRenderContext {
  /** Current state values */
  state: Record<string, unknown>
  /** External data passed to the template */
  data: Record<string, unknown>
  /** Function to update state */
  setState: (updates: Record<string, unknown>) => void
  /** Function to trigger an action */
  triggerAction: (actionId: string, payload?: unknown) => void
  /** Function to navigate to a route */
  navigate: (path: string) => void
  /** Available fragments for reference resolution */
  fragments?: Record<string, TemplateFragment>
  /** Plugin context for plugin-specific data */
  pluginContext?: {
    pluginId: number
    pluginName: string
  }
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  /** Whether the template is valid */
  valid: boolean
  /** Validation errors if invalid */
  errors?: TemplateValidationError[]
  /** Validation warnings (template is valid but has issues) */
  warnings?: TemplateValidationWarning[]
}

/**
 * Template validation error
 */
export interface TemplateValidationError {
  /** Error code */
  code: string
  /** Human-readable error message */
  message: string
  /** Path to the problematic part of the template */
  path: string
  /** Additional context */
  context?: Record<string, unknown>
}

/**
 * Template validation warning
 */
export interface TemplateValidationWarning {
  /** Warning code */
  code: string
  /** Human-readable warning message */
  message: string
  /** Path to the relevant part of the template */
  path: string
  /** Additional context */
  context?: Record<string, unknown>
}
