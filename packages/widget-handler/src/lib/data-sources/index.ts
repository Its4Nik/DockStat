/**
 * Data Source Manager
 *
 * Manages data fetching, caching, and refresh intervals for widgets.
 */

import type {
  DataSourceAdapter,
  DataSourceCacheEntry,
  DataSourceConfig,
  DataSourceResult,
  DataSourceState,
} from "../../types"
import { getBuiltinAdapters } from "./adapters"

/**
 * Data Source Manager
 */
export class DataSourceManager {
  private adapters: Map<string, DataSourceAdapter> = new Map()
  private cache: Map<string, DataSourceCacheEntry> = new Map()
  private refreshIntervals: Map<string, ReturnType<typeof setInterval>> = new Map()
  private pendingRequests: Map<string, Promise<DataSourceResult>> = new Map()
  private defaultTTL: number
  private maxCacheSize: number

  constructor(options?: { defaultTTL?: number; maxCacheSize?: number }) {
    this.defaultTTL = options?.defaultTTL ?? 60000 // 1 minute default
    this.maxCacheSize = options?.maxCacheSize ?? 100

    // Register built-in adapters
    for (const adapter of getBuiltinAdapters()) {
      this.registerAdapter(adapter)
    }
  }

  /**
   * Register a data source adapter
   */
  registerAdapter(adapter: DataSourceAdapter): void {
    this.adapters.set(adapter.type, adapter)
  }

  /**
   * Get adapter for a data source type
   */
  getAdapter(type: string): DataSourceAdapter | undefined {
    return this.adapters.get(type)
  }

  /**
   * Fetch data from a data source
   */
  async fetch<T = unknown>(
    key: string,
    config: DataSourceConfig,
    options?: {
      forceRefresh?: boolean
      ttl?: number
      signal?: AbortSignal
    }
  ): Promise<DataSourceResult<T>> {
    const adapter = this.adapters.get(config.type)
    if (!adapter) {
      throw new Error(`No adapter registered for data source type: ${config.type}`)
    }

    // Check for pending request (deduplication)
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending as Promise<DataSourceResult<T>>
    }

    // Check cache
    if (!options?.forceRefresh) {
      const cached = this.getFromCache<T>(key)
      if (cached) {
        return { ...cached, fromCache: true }
      }
    }

    // Make request
    const requestPromise = adapter.fetch(
      config as Parameters<typeof adapter.fetch>[0],
      options?.signal
    )
    this.pendingRequests.set(key, requestPromise)

    try {
      const result = await requestPromise

      // Cache the result
      this.setCache(key, result.data, options?.ttl ?? this.defaultTTL)

      return result as DataSourceResult<T>
    } finally {
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Start auto-refresh for a data source
   */
  startAutoRefresh(
    key: string,
    config: DataSourceConfig,
    callback: (state: DataSourceState) => void,
    interval?: number
  ): void {
    // Stop existing refresh
    this.stopAutoRefresh(key)

    // Get refresh interval from config or use default
    const refreshInterval =
      interval ??
      (config.type === "rest" ? config.refreshInterval : undefined) ??
      (config.type === "mock" ? config.interval : undefined) ??
      30000

    const refresh = async (): Promise<void> => {
      try {
        callback({
          status: "refreshing",
          data: null,
          error: null,
          lastUpdated: null,
          refreshCount: 0,
        })
        const result = await this.fetch(key, config, { forceRefresh: true })
        callback({
          status: "success",
          data: result.data,
          error: null,
          lastUpdated: result.meta?.timestamp ?? new Date(),
          refreshCount: 1,
        })
      } catch (error) {
        callback({
          status: "error",
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          lastUpdated: null,
          refreshCount: 0,
        })
      }
    }

    // Initial fetch
    void refresh()

    // Set up interval
    const intervalId = setInterval(() => {
      void refresh()
    }, refreshInterval)

    this.refreshIntervals.set(key, intervalId)
  }

  /**
   * Stop auto-refresh for a data source
   */
  stopAutoRefresh(key: string): void {
    const intervalId = this.refreshIntervals.get(key)
    if (intervalId) {
      clearInterval(intervalId)
      this.refreshIntervals.delete(key)
    }
  }

  /**
   * Stop all auto-refresh intervals
   */
  stopAllAutoRefresh(): void {
    for (const key of this.refreshIntervals.keys()) {
      this.stopAutoRefresh(key)
    }
  }

  /**
   * Get data from cache
   */
  private getFromCache<T>(key: string): DataSourceResult<T> | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    const timestamp = entry.timestamp.getTime()

    if (now - timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return { data: entry.data as T, meta: { timestamp: entry.timestamp, responseTime: 0 } }
  }

  /**
   * Set cache entry
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    // Enforce max cache size
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: new Date(),
      key,
      ttl,
    })
  }

  /**
   * Clear cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAllAutoRefresh()
    this.cache.clear()
    this.pendingRequests.clear()
  }
}

/**
 * Global data source manager instance
 */
export const dataSourceManager = new DataSourceManager()
