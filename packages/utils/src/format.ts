/**
 * Formatting utility functions
 * @module format
 */

/**
 * Formats bytes into human-readable strings.
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

/**
 * Formats milliseconds into a human-readable duration.
 * @param ms - Milliseconds
 * @param options - Formatting options
 * @returns Formatted duration string
 */
export function formatDuration(ms: number, options?: { compact?: boolean }): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const s = seconds % 60
  const m = minutes % 60
  const h = hours % 24

  const parts: string[] = []

  if (days > 0) {
    parts.push(`${days}d`)
  }
  if (hours > 0 || days > 0) {
    parts.push(`${h}h`)
  }
  if (minutes > 0 || hours > 0 || days > 0) {
    parts.push(`${m}m`)
  }
  if (parts.length === 0 || (!options?.compact && parts.length < 3)) {
    parts.push(`${s}s`)
  }

  if (options?.compact) {
    return parts.slice(0, 2).join(" ")
  }

  return parts.join(" ")
}

/**
 * Formats numbers with thousands separators.
 * @param num - Number to format
 * @param locale - Locale string (default: "en-US")
 * @returns Formatted number string
 */
export function formatNumber(num: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Formats a number as a percentage.
 * @param num - Number to format (0.5 = 50%)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercent(num: number, decimals = 0): string {
  return `${(num * 100).toFixed(decimals)}%`
}

/**
 * Formats dates into readable strings.
 * @param date - Date to format
 * @param format - Format type
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  format: "short" | "long" | "time" | "datetime" | "iso" | "log" = "short"
): string {
  switch (format) {
    case "short":
      return new Intl.DateTimeFormat("de-DE", {
        day: "numeric",
        month: "numeric",
        year: "2-digit",
      }).format(date)

    case "log": {
      const base = new Intl.DateTimeFormat("de-DE", {
        hour12: false,
        minute: "2-digit",
        hour: "2-digit",
      }).format(date)

      return `${base}.${new Intl.DateTimeFormat("de-DE", { second: "2-digit" }).format(date)}`
    }

    case "long":
      return new Intl.DateTimeFormat("de-DE", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date)

    case "time":
      return new Intl.DateTimeFormat("de-DE", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date)

    case "datetime":
      return new Intl.DateTimeFormat("de-DE", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date)

    case "iso":
      return date.toISOString()

    default:
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)
  }
}

/**
 * Formats a date as relative time (e.g., "2 hours ago").
 * @param date - Date to format
 * @returns Relative time string
 */
export function relativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(Math.abs(diffMs) / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  const isFuture = diffMs < 0

  if (diffYear > 0) {
    const unit = diffYear === 1 ? "year" : "years"
    return isFuture ? `in ${diffYear} ${unit}` : `${diffYear} ${unit} ago`
  }

  if (diffMonth > 0) {
    const unit = diffMonth === 1 ? "month" : "months"
    return isFuture ? `in ${diffMonth} ${unit}` : `${diffMonth} ${unit} ago`
  }

  if (diffWeek > 0) {
    const unit = diffWeek === 1 ? "week" : "weeks"
    return isFuture ? `in ${diffWeek} ${unit}` : `${diffWeek} ${unit} ago`
  }

  if (diffDay > 0) {
    const unit = diffDay === 1 ? "day" : "days"
    return isFuture ? `in ${diffDay} ${unit}` : `${diffDay} ${unit} ago`
  }

  if (diffHour > 0) {
    const unit = diffHour === 1 ? "hour" : "hours"
    return isFuture ? `in ${diffHour} ${unit}` : `${diffHour} ${unit} ago`
  }

  if (diffMin > 0) {
    const unit = diffMin === 1 ? "minute" : "minutes"
    return isFuture ? `in ${diffMin} ${unit}` : `${diffMin} ${unit} ago`
  }

  if (diffSec > 0) {
    const unit = diffSec === 1 ? "second" : "seconds"
    return isFuture ? `in ${diffSec} ${unit}` : `${diffSec} ${unit} ago`
  }

  return "just now"
}
