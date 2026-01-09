/**
 * @dockstat/utils - Shared utility functions
 * @module @dockstat/utils
 */

import * as errorUtils from "./error"

export * as arrayUtils from "./array"
export * as repo from "./repo"

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
export * from "./async"
// Container utilities
export * from "./container"
// Data utilities
export * from "./data"
export type * from "./error"
// Error utilities
export * from "./error"
// Formatting utilities
export * from "./format"
// String utilities
export * from "./string"
// Type utilities
export * from "./type"
