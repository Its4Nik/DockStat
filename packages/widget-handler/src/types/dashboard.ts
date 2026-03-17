/**
 * Dashboard Types for DockStat Widget Handler
 *
 * Defines types for dashboard configuration, state, and export/import.
 */

import type { DataSourceState } from "./data-source";
import type { WidgetInstance, WidgetLayout } from "./widget";

/**
 * Dashboard grid configuration
 */
export interface DashboardGridConfig {
  /** Number of columns */
  columns: number;
  /** Row height in pixels */
  rowHeight: number;
  /** Gap between widgets */
  gap?: number;
  /** Breakpoints for responsive layout */
  breakpoints?: Record<string, number>;
  /** Whether to auto-pack widgets */
  compact?: boolean | "vertical" | "horizontal";
  /** Whether to prevent collision */
  preventCollision?: boolean;
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig extends Record<string, unknown> {
  /** Dashboard ID */
  id: string;
  /** Dashboard name */
  name: string;
  /** Dashboard description */
  description?: string;
  /** Grid configuration */
  grid: DashboardGridConfig;
  /** Widget instances */
  widgets: WidgetInstance[];
  /** Dashboard-level settings */
  settings?: DashboardSettings;
  /** Created timestamp */
  createdAt: Date;
  /** Last modified timestamp */
  updatedAt: Date;
  /** Version for migration */
  version: string;
}

/**
 * Dashboard-level settings
 */
export interface DashboardSettings {
  /** Auto-refresh interval for all data sources */
  refreshInterval?: number;
  /** Default time range for data queries */
  defaultTimeRange?: TimeRange;
  /** Theme settings */
  theme?: DashboardTheme;
  /** Edit mode enabled */
  editMode?: boolean;
  /** Show widget borders */
  showBorders?: boolean;
  /** Background color/image */
  background?: string;
}

/**
 * Time range configuration
 */
export interface TimeRange {
  /** Start time or relative offset */
  from: string | Date;
  /** End time or relative offset */
  to: string | Date;
  /** Time zone */
  timeZone?: string;
}

/**
 * Dashboard theme settings
 */
export interface DashboardTheme {
  /** Color scheme */
  colorScheme?: "light" | "dark" | "system";
  /** Custom colors */
  colors?: Record<string, string>;
  /** Font family */
  fontFamily?: string;
}

/**
 * Dashboard state for runtime
 */
export interface DashboardState {
  /** Current configuration */
  config: DashboardConfig;
  /** Data source states by widget ID */
  dataSourceStates: Record<string, DataSourceState>;
  /** Selected widget ID */
  selectedWidgetId: string | null;
  /** Edit mode active */
  isEditing: boolean;
  /** Drawer open state */
  isDrawerOpen: boolean;
  /** Has unsaved changes */
  isDirty: boolean;
  /** Clipboard for copy/paste */
  clipboard: WidgetInstance | null;
  /** History for undo/redo */
  history: DashboardHistory;
}

/**
 * History entry for undo/redo
 */
export interface DashboardHistoryEntry {
  /** Widget instances at this point */
  widgets: WidgetInstance[];
  /** Timestamp */
  timestamp: Date;
  /** Action description */
  action: string;
}

/**
 * Dashboard history state
 */
export interface DashboardHistory {
  /** Past states */
  past: DashboardHistoryEntry[];
  /** Future states (for redo) */
  future: DashboardHistoryEntry[];
  /** Maximum history size */
  maxSize: number;
}

/**
 * Dashboard actions for reducer
 */
export type DashboardAction =
  | { type: "ADD_WIDGET"; payload: WidgetInstance }
  | { type: "REMOVE_WIDGET"; payload: string }
  | {
      type: "UPDATE_WIDGET";
      payload: { id: string; updates: Partial<WidgetInstance> };
    }
  | { type: "UPDATE_LAYOUT"; payload: { id: string; layout: WidgetLayout }[] }
  | { type: "SELECT_WIDGET"; payload: string | null }
  | { type: "SET_EDITING"; payload: boolean }
  | { type: "SET_DRAWER_OPEN"; payload: boolean }
  | {
      type: "SET_DATA_STATE";
      payload: { id: string; state: Partial<DataSourceState> };
    }
  | { type: "SET_DIRTY"; payload: boolean }
  | { type: "COPY_WIDGET"; payload: string }
  | { type: "PASTE_WIDGET" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "LOAD_DASHBOARD"; payload: DashboardConfig }
  | { type: "RESET_DASHBOARD" };

/**
 * Dashboard export format
 */
export interface DashboardExport {
  /** Export format version */
  version: string;
  /** Export timestamp */
  exportedAt: string;
  /** Dashboard configuration */
  dashboard: DashboardConfig;
  /** Export options */
  options?: DashboardExportOptions;
}

/**
 * Export options
 */
export interface DashboardExportOptions {
  /** Include widget data */
  includeData?: boolean;
  /** Include data source credentials */
  includeCredentials?: boolean;
  /** Compress the export */
  compress?: boolean;
}

/**
 * Dashboard import result
 */
export interface DashboardImportResult {
  success: boolean;
  dashboard?: DashboardConfig;
  errors?: string[];
  warnings?: string[];
}

/**
 * Default dashboard grid configuration
 */
export const DEFAULT_GRID_CONFIG: DashboardGridConfig = {
  columns: 12,
  rowHeight: 60,
  gap: 16,
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
  },
  compact: true,
  preventCollision: false,
};

/**
 * Default dashboard settings
 */
export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  refreshInterval: 30000,
  editMode: true,
  showBorders: true,
};

/**
 * Dashboard version for migrations
 */
export const DASHBOARD_VERSION = "1.0.0";
