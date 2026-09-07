/**
 * In-memory cache with TTL support (ported from the old API app).
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor(
    private readonly defaultTtlMs: number = 60_000,
    cleanupIntervalMs: number = 30_000
  ) {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache) {
        if (now > entry.expiresAt) this.cache.delete(key)
      }
    }, cleanupIntervalMs)
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    return entry.data as T
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, { data, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) })
  }

  getOrCompute<T>(key: string, compute: () => T, ttlMs?: number): T {
    const cached = this.get<T>(key)
    if (cached !== undefined) return cached
    const data = compute()
    this.set(key, data, ttlMs)
    return data
  }

  async getOrComputeAsync<T>(key: string, compute: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined) return cached
    const result = await compute()
    this.set(key, result, ttlMs)
    return result
  }

  invalidate(key?: string): void {
    if (key) this.cache.delete(key)
    else this.cache.clear()
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.cache.clear()
  }
}

export const configCache = new MemoryCache(30_000) // 30s - config rarely changes
export const statusCache = new MemoryCache(5_000) // 5s - status checks
export const repoCache = new MemoryCache(5 * 60_000) // 5m - repository manifests
export const dockerCache = new MemoryCache(10_000) // 10s - docker stats
