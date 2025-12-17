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

// Async utilities
export {
  debounce,
  retry,
  sleep,
  throttle,
  timeout,
} from "./async"
// Container utilities
export {
  calculateCpuPercent,
  calculateMemoryPercent,
  parseContainerName,
  parseImageName,
} from "./container"
// Data utilities
export {
  deepClone,
  deepMerge,
  groupBy,
  omit,
  pick,
  sortBy,
  uniqueBy,
} from "./data"
// Formatting utilities
export {
  formatBytes,
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
  relativeTime,
} from "./format"
// String utilities
export {
  camelToKebab,
  capitalize,
  escapeHtml,
  kebabToCamel,
  slugify,
  truncate,
} from "./string"
// Type utilities
export {
  isArray,
  isFunction,
  isNotNullish,
  isNumber,
  isObject,
  isString,
} from "./type"
