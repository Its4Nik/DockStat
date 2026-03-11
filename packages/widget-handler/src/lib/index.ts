/**
 * Widget Handler Library
 *
 * Re-exports core utilities and managers.
 */

export { DataSourceManager, dataSourceManager } from "./data-sources"
export {
  getBuiltinAdapters,
  mockAdapter,
  registerMockGenerator,
  restAdapter,
  staticAdapter,
} from "./data-sources/adapters"
export { RegisterWidget, WidgetRegistry } from "./widget-registry"
