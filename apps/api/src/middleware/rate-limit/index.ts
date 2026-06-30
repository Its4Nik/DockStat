/**
 * Simple in-memory rate limiter using sliding window
 * No external dependencies required
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitResult {
  remaining: number
  resetAt: number
  success: boolean
}

class RateLimiter {
  private entries = new Map<string, RateLimitEntry>()
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor(
    private readonly defaultConfig: RateLimitConfig = {
      maxRequests: 100,
      windowMs: 60_000,
    },
    cleanupIntervalMs: number = 60_000
  ) {
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs)
  }

  /**
   * Check if a request is allowed and update the counter
   */
  check(key: string, config?: Partial<RateLimitConfig>): RateLimitResult {
    const windowMs = config?.windowMs ?? this.defaultConfig.windowMs
    const maxRequests = config?.maxRequests ?? this.defaultConfig.maxRequests
    const now = Date.now()

    let entry = this.entries.get(key)

    // Reset if window expired
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      this.entries.set(key, entry)
    }

    entry.count++
    const remaining = Math.max(0, maxRequests - entry.count)

    return {
      remaining,
      resetAt: entry.resetAt,
      success: entry.count <= maxRequests,
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  getStatus(key: string): RateLimitResult | null {
    const entry = this.entries.get(key)
    if (!entry) return null

    const maxRequests = this.defaultConfig.maxRequests
    return {
      remaining: Math.max(0, maxRequests - entry.count),
      resetAt: entry.resetAt,
      success: entry.count < maxRequests,
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.entries.delete(key)
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.entries) {
      if (now > entry.resetAt) {
        this.entries.delete(key)
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.entries.clear()
  }
}

// Default rate limiter instances
export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60_000,
})

export const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60_000, // 15 minutes
})

export const dockerRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60_000,
})

export { RateLimiter }
export type { RateLimitConfig, RateLimitResult }
