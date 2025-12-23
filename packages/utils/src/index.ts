/**
 * @dockstat/utils - Shared utility functions
 * @module @dockstat/utils
 */

import * as errorUtils from "./error"
// Preserve existing exports
import * as HTTP_RequestID from "./http/RequestId"
import * as buildMessage from "./worker/buildMessage"

export const worker = {
  buildMessage: buildMessage,
}

export const http = {
  requestId: HTTP_RequestID,
}

export const error = errorUtils

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
export type {
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
  EdenElysiaError,
  EdenErrorResponse,
  ElysiaErrorValue,
} from "./error"
// Error utilities
export {
  createApiErrorResponse,
  createApiSuccessResponse,
  extractEdenError,
  extractErrorMessage,
  handleElysiaError,
  isApiErrorResponse,
  isApiSuccessResponse,
  isEdenError,
  withErrorHandling,
} from "./error"
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
