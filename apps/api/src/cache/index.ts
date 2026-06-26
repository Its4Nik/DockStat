/**
 * In-memory cache with TTL support
 * Provides a simple caching mechanism without external dependencies
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 }
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly defaultTtlMs: number = 60_000,
    private readonly cleanupIntervalMs: number = 30_000
  ) {
    this.startCleanup()
  }

  /**
   * Get a value from cache, or compute and store it if missing/expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) {
      this.stats.misses++
      return undefined
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size = this.cache.size
      return undefined
    }

    this.stats.hits++
    return entry.data as T
  }

  /**
   * Set a value in cache with optional TTL override
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    })
    this.stats.size = this.cache.size
  }

  /**
   * Get from cache, or compute and store if missing
   */
  getOrCompute<T>(key: string, compute: () => T, ttlMs?: number): T {
    const cached = this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const data = compute()
    this.set(key, data, ttlMs)
    return data
  }

  /**
   * Async version of getOrCompute
   */
  async getOrComputeAsync<T>(key: string, compute: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const data = await compute()
    this.set(key, data, ttlMs)
    return data
  }

  /**
   * Invalidate a specific key or all keys matching a prefix
   */
  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
    this.stats.size = this.cache.size
  }

  /**
   * Invalidate all keys matching a prefix
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
        count++
      }
    }
    this.stats.size = this.cache.size
    return count
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache) {
        if (now > entry.expiresAt) {
          this.cache.delete(key)
        }
      }
      this.stats.size = this.cache.size
    }, this.cleanupIntervalMs)
  }

  /**
   * Stop cleanup and clear cache
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
    this.stats.size = 0
  }
}

// Default cache instances with different TTLs
export const configCache = new MemoryCache(30_000) // 30s - config rarely changes
export const statusCache = new MemoryCache(5_000) // 5s - status checks
export const repoCache = new MemoryCache(5 * 60_000) // 5m - repository manifests
export const dockerCache = new MemoryCache(10_000) // 10s - docker stats

export { MemoryCache }
export type { CacheStats }
