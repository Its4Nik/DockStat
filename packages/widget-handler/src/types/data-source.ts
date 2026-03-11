/**
 * Data Source Types for DockStat Widget Handler
 *
 * Defines types for data fetching, caching, and transformation.
 */

import type { DataSourceConfig } from "./widget"

/**
 * Data source adapter interface
 */
export interface DataSourceAdapter<TConfig extends DataSourceConfig = DataSourceConfig> {
  /** Adapter type identifier */
  type: TConfig["type"]
  /** Fetch data from the source */
  fetch(config: TConfig, signal?: AbortSignal): Promise<DataSourceResult>
  /** Validate configuration */
  validateConfig(config: unknown): config is TConfig
  /** Get default configuration */
  getDefaultConfig(): Partial<TConfig>
}

/**
 * Result from data source fetch
 */
export interface DataSourceResult<T = unknown> {
  /** The fetched data */
  data: T
  /** Response metadata */
  meta?: DataSourceMeta
  /** Whether the data came from cache */
  fromCache?: boolean
}

/**
 * Metadata about the data source response
 */
export interface DataSourceMeta {
  /** Timestamp when data was fetched */
  timestamp: Date
  /** Response time in milliseconds */
  responseTime: number
  /** Source-specific metadata */
  [key: string]: unknown
}

/**
 * Cache entry for data source results
 */
export interface DataSourceCacheEntry<T = unknown> {
  /** Cached data */
  data: T
  /** When the data was cached */
  timestamp: Date
  /** Cache key */
  key: string
  /** Time-to-live in milliseconds */
  ttl: number
  /** ETag for conditional requests */
  etag?: string
}

/**
 * Data transformation function type
 */
export type DataTransformer<TInput = unknown, TOutput = unknown> = (
  data: TInput,
  context: TransformContext
) => TOutput | Promise<TOutput>

/**
 * Context passed to data transformers
 */
export interface TransformContext {
  /** Previous transformation result (for chaining) */
  previous?: unknown
  /** Original data source configuration */
  config: DataSourceConfig
  /** Widget instance ID */
  widgetId: string
  /** Current timestamp */
  timestamp: Date
}

/**
 * Data parser configuration
 */
export interface DataParserConfig {
  /** Parser type */
  type: "json" | "csv" | "xml" | "yaml" | "regex"
  /** Parser-specific options */
  options?: Record<string, unknown>
  /** Path to extract data (e.g., JSONPath) */
  extractPath?: string
  /** Post-processing transformations */
  transforms?: DataTransformStep[]
}

/**
 * Single transformation step
 */
export interface DataTransformStep {
  type: "map" | "filter" | "reduce" | "sort" | "group" | "custom"
  config: Record<string, unknown>
}

/**
 * Mock data generator configuration
 */
export interface MockGeneratorConfig {
  /** Generator type */
  type: "random" | "increment" | "sin" | "sawtooth" | "square" | "custom"
  /** Value range */
  min?: number
  max?: number
  /** Increment step (for increment type) */
  step?: number
  /** Period (for wave types) */
  period?: number
  /** Custom generator function name */
  customFunction?: string
}

/**
 * Mock data generators registry
 */
export type MockGeneratorFn = (config: MockGeneratorConfig, timestamp: number) => unknown

/**
 * REST data source configuration with extended options
 */
export interface RestDataSourceConfig {
  type: "rest"
  url: string
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  headers?: Record<string, string>
  body?: unknown
  queryParams?: Record<string, string | number | boolean>
  refreshInterval?: number
  retryCount?: number
  retryDelay?: number
  timeout?: number
}

/**
 * WebSocket data source configuration
 */
export interface WebSocketDataSourceConfig {
  type: "websocket"
  url: string
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  protocols?: string[]
}

/**
 * GraphQL data source configuration
 */
export interface GraphQLDataSourceConfig {
  type: "graphql"
  url: string
  query: string
  variables?: Record<string, unknown>
  operationName?: string
  headers?: Record<string, string>
  refreshInterval?: number
}

/**
 * Data source status
 */
export type DataSourceStatus = "idle" | "loading" | "success" | "error" | "refreshing"

/**
 * Data source state for a widget
 */
export interface DataSourceState<T = unknown> {
  /** Current status */
  status: DataSourceStatus
  /** Loaded data */
  data: T | null
  /** Error if any */
  error: Error | null
  /** Last successful update */
  lastUpdated: Date | null
  /** Number of refresh attempts */
  refreshCount: number
}
