/**
 * @dockstat/utils - Shared utility functions
 * @module @dockstat/utils
 */

// Preserve existing exports
import * as HTTP_RequestID from "./http/RequestId"
import * as buildMessage from "./worker/buildMessage"

export const worker = {
  buildMessage: buildMessage,
}

export const http = {
  requestId: HTTP_RequestID,
}

// String utilities
export {
  truncate,
  capitalize,
  camelToKebab,
  kebabToCamel,
  slugify,
  escapeHtml,
} from "./string"

// Formatting utilities
export {
  formatBytes,
  formatDuration,
  formatNumber,
  formatPercent,
  formatDate,
  relativeTime,
} from "./format"

// Type utilities
export {
  isNotNullish,
  isString,
  isNumber,
  isObject,
  isArray,
  isFunction,
} from "./type"

// Data utilities
export {
  deepClone,
  deepMerge,
  pick,
  omit,
  groupBy,
  uniqueBy,
  sortBy,
} from "./data"

// Async utilities
export {
  debounce,
  throttle,
  sleep,
  retry,
  timeout,
} from "./async"

// Container utilities
export {
  parseContainerName,
  parseImageName,
  calculateCpuPercent,
  calculateMemoryPercent,
} from "./container"
