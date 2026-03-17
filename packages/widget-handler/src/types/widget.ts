/**
 * Core Widget Types for DockStat Widget Handler
 *
 * Provides type-safe widget definitions with generic support for
 * configuration and data types.
 */

import type { ComponentType, ReactNode } from "react"
import type { DataParserConfig } from "./data-source"

/**
 * Layout position for a widget in the grid
 */
export interface WidgetLayout {
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

/**
 * Data source configuration - discriminated union
 */
export type DataSourceConfig =
  | {
      type: "rest"
      url: string
      method?: "GET" | "POST"
      headers?: Record<string, string>
      body?: unknown
      refreshInterval?: number
    }
  | { type: "static"; data: unknown }
  | { type: "mock"; generator: string; interval?: number }
  | { type: "websocket"; url: string; reconnect?: boolean }
  | { type: "graphql"; url: string; query: string; variables?: Record<string, unknown> }

/**
 * Widget definition with full type safety
 * @template TConfig - Configuration props type
 * @template TData - Data type returned from data source
 */
export interface WidgetDefinition<TConfig = Record<string, unknown>, TData = unknown> {
  /** Unique widget type identifier */
  type: string
  /** Display name for the widget palette */
  name: string
  /** Description shown in widget palette */
  description: string
  /** Icon component or name for the widget */
  icon: ReactNode
  /** Default configuration values */
  defaultConfig: TConfig
  /** Default layout dimensions */
  defaultLayout: WidgetLayout
  /** Default data source configuration */
  defaultDataSource?: DataSourceConfig
  /** Configuration schema for validation and form generation */
  configSchema?: WidgetConfigSchema
  /** React component to render the widget */
  component: ComponentType<WidgetComponentProps<TConfig, TData>>
  /** Category for organizing in widget palette */
  category?: string
  /** Tags for searching/filtering */
  tags?: string[]
}

/**
 * Props passed to widget components
 */
export interface WidgetComponentProps<TConfig = Record<string, unknown>, TData = unknown> {
  /** Widget instance ID */
  id: string
  /** Resolved configuration */
  config: TConfig
  /** Data from data source */
  data: TData | null
  /** Loading state */
  isLoading: boolean
  /** Error from data source */
  error: Error | null
  /** Last data update timestamp */
  lastUpdated?: Date
  /** Callback to update configuration */
  onConfigChange: (config: Partial<TConfig>) => void
  /** Callback to refresh data */
  onRefresh: () => void
}

/**
 * Widget instance on a dashboard
 */
export interface WidgetInstance<TConfig = Record<string, unknown>> {
  /** Unique instance ID */
  id: string
  /** Widget type reference */
  type: string
  /** Instance-specific configuration */
  config: TConfig
  /** Layout position */
  layout: WidgetLayout
  /** Data source override */
  dataSource?: DataSourceConfig
  /** Data parser configuration */
  dataParser?: DataParserConfig
  /** Custom title override */
  title?: string
  /** Visibility state */
  visible?: boolean
}

/**
 * Configuration field schema for form generation
 */
export interface WidgetConfigSchema {
  fields: WidgetConfigField[]
}

export interface WidgetConfigField {
  name: string
  type: "text" | "number" | "boolean" | "select" | "color" | "json" | "range"
  label: string
  description?: string
  required?: boolean
  defaultValue?: unknown
  options?: { label: string; value: unknown }[]
  min?: number
  max?: number
  step?: number
  validation?: {
    pattern?: string
    min?: number
    max?: number
    message?: string
  }
}

/**
 * Widget template for quick instantiation
 */
export interface WidgetTemplate {
  id: string
  name: string
  description: string
  widgetType: string
  presetConfig: Record<string, unknown>
  presetLayout: WidgetLayout
  presetDataSource?: DataSourceConfig
}

/**
 * Widget size presets
 */
export const WIDGET_SIZES = {
  small: { w: 2, h: 2, minW: 2, minH: 2 },
  medium: { w: 4, h: 3, minW: 3, minH: 2 },
  large: { w: 6, h: 4, minW: 4, minH: 3 },
  wide: { w: 6, h: 2, minW: 4, minH: 2 },
  tall: { w: 2, h: 6, minW: 2, minH: 4 },
} as const

export type WidgetSize = keyof typeof WIDGET_SIZES
