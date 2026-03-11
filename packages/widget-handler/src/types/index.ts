/**
 * Widget Handler Types
 *
 * Re-exports all type definitions for the widget handler package.
 */

// Dashboard types
export type {
  DashboardAction,
  DashboardConfig,
  DashboardExport,
  DashboardExportOptions,
  DashboardGridConfig,
  DashboardHistory,
  DashboardHistoryEntry,
  DashboardImportResult,
  DashboardSettings,
  DashboardState,
  DashboardTheme,
  TimeRange,
} from "./dashboard"
export {
  DASHBOARD_VERSION,
  DEFAULT_DASHBOARD_SETTINGS,
  DEFAULT_GRID_CONFIG,
} from "./dashboard"

// Data source types
export type {
  DataParserConfig,
  DataSourceAdapter,
  DataSourceCacheEntry,
  DataSourceMeta,
  DataSourceResult,
  DataSourceState,
  DataSourceStatus,
  DataTransformer,
  DataTransformStep,
  GraphQLDataSourceConfig,
  MockGeneratorConfig,
  MockGeneratorFn,
  RestDataSourceConfig,
  TransformContext,
  WebSocketDataSourceConfig,
} from "./data-source"
// Widget types
export type {
  DataSourceConfig,
  WidgetComponentProps,
  WidgetConfigField,
  WidgetConfigSchema,
  WidgetDefinition,
  WidgetInstance,
  WidgetLayout,
  WidgetTemplate,
} from "./widget"
export { WIDGET_SIZES, type WidgetSize } from "./widget"
