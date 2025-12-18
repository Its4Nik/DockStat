/**
 * Error extraction and handling utilities
 * @module @dockstat/utils/error
 */

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  success: false
  error: string
  message?: string
  path?: string
  timestamp?: string
  detail?: unknown
}

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

/**
 * Union type for API responses
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Eden treaty error response structure
 * When Eden receives a non-2xx response, it wraps the response body in the error property
 */
export interface EdenErrorResponse {
  status: number
  error: unknown
  data?: null
}

/**
 * Check if a value is an ApiErrorResponse
 */
export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    (value as Record<string, unknown>).success === false &&
    "error" in value &&
    typeof (value as Record<string, unknown>).error === "string"
  )
}

/**
 * Check if a value is an ApiSuccessResponse
 */
export function isApiSuccessResponse<T = unknown>(value: unknown): value is ApiSuccessResponse<T> {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    (value as Record<string, unknown>).success === true
  )
}

/**
 * Extract error message from various error formats
 *
 * Handles:
 * - Plain strings
 * - Error instances
 * - API error responses { success: false, error: "..." }
 * - Eden treaty error responses { status: number, error: {...} }
 * - Nested error objects
 * - Objects with message property
 * - Objects with error property
 * - Objects with value property (some Eden versions)
 *
 * @param error - The error to extract a message from
 * @param fallback - Fallback message if extraction fails
 * @returns The extracted error message
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred"
): string {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return fallback
  }

  // Handle plain strings
  if (typeof error === "string") {
    return error.trim() || fallback
  }

  // Handle Error instances
  if (error instanceof Error) {
    return error.message || fallback
  }

  // Handle objects
  if (typeof error === "object") {
    const err = error as Record<string, unknown>

    // Check for direct error string property (API response: { success: false, error: "message" })
    if (typeof err.error === "string" && err.error.trim()) {
      return err.error.trim()
    }

    // Check for direct message string property
    if (typeof err.message === "string" && err.message.trim()) {
      return err.message.trim()
    }

    // Handle Eden treaty error structure: { status: number, error: { success: false, error: "..." } }
    // The error property contains the full API response body
    if (err.error !== null && err.error !== undefined && typeof err.error === "object") {
      const nestedError = err.error as Record<string, unknown>

      // Extract from nested API error response
      if (typeof nestedError.error === "string" && nestedError.error.trim()) {
        return nestedError.error.trim()
      }

      if (typeof nestedError.message === "string" && nestedError.message.trim()) {
        return nestedError.message.trim()
      }

      // Handle Error instance in nested error
      if (nestedError instanceof Error) {
        return nestedError.message || fallback
      }
    }

    // Handle value wrapper (some Eden versions or custom wrappers)
    // Structure: { status: number, value: { success: false, error: "..." } }
    if (err.value !== null && err.value !== undefined && typeof err.value === "object") {
      const nestedValue = err.value as Record<string, unknown>

      if (typeof nestedValue.error === "string" && nestedValue.error.trim()) {
        return nestedValue.error.trim()
      }

      if (typeof nestedValue.message === "string" && nestedValue.message.trim()) {
        return nestedValue.message.trim()
      }
    }

    // Handle data wrapper (alternative response structure)
    if (err.data !== null && err.data !== undefined && typeof err.data === "object") {
      const nestedData = err.data as Record<string, unknown>

      if (typeof nestedData.error === "string" && nestedData.error.trim()) {
        return nestedData.error.trim()
      }

      if (typeof nestedData.message === "string" && nestedData.message.trim()) {
        return nestedData.message.trim()
      }
    }

    // Handle cause property (Error.cause pattern)
    if (err.cause !== null && err.cause !== undefined) {
      const causeMessage = extractErrorMessage(err.cause, "")
      if (causeMessage) {
        return causeMessage
      }
    }

    // Last resort: try to stringify but avoid useless output
    try {
      const str = JSON.stringify(error)
      if (str && str !== "{}" && str !== "[]" && str !== "[object Object]" && str.length < 500) {
        return str
      }
    } catch {
      // JSON stringify failed, fall through to fallback
    }
  }

  // Handle numbers, booleans, etc.
  const strValue = String(error)
  if (
    strValue &&
    strValue !== "[object Object]" &&
    strValue !== "undefined" &&
    strValue !== "null"
  ) {
    return strValue
  }

  return fallback
}

/**
 * Create a standardized API error response
 *
 * @param error - Error message or Error object
 * @param additionalFields - Optional additional fields to include
 * @returns Standardized error response object
 */
export function createApiErrorResponse(
  error: string | Error | unknown,
  additionalFields?: Partial<Omit<ApiErrorResponse, "success" | "error">>
): ApiErrorResponse {
  return {
    success: false,
    error: extractErrorMessage(error),
    ...additionalFields,
  }
}

/**
 * Create a standardized API success response
 *
 * @param data - Response data
 * @param message - Optional success message
 * @returns Standardized success response object
 */
export function createApiSuccessResponse<T>(data?: T, message?: string): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = { success: true }
  if (data !== undefined) {
    response.data = data
  }
  if (message) {
    response.message = message
  }
  return response
}

/**
 * Wrap a function to catch and transform errors into API error responses
 *
 * @param fn - The async function to wrap
 * @param fallbackMessage - Fallback error message
 * @returns The wrapped function that returns ApiResponse
 */
export function withErrorHandling<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  fallbackMessage = "Operation failed"
): (...args: Args) => Promise<ApiResponse<T>> {
  return async (...args: Args): Promise<ApiResponse<T>> => {
    try {
      const result = await fn(...args)
      return createApiSuccessResponse(result)
    } catch (error) {
      return createApiErrorResponse(error, {
        message: fallbackMessage,
      })
    }
  }
}

/**
 * Type guard to check if an Eden response is an error response
 */
export function isEdenError<T>(response: {
  status: number
  data?: T
  error?: unknown
}): response is { status: number; data: undefined; error: unknown } {
  return response.status >= 400 || response.error !== undefined
}

/**
 * Extract error from Eden treaty response
 *
 * @param response - Eden treaty response object
 * @param fallback - Fallback error message
 * @returns Error message string
 */
export function extractEdenError(
  response: { status?: number; error?: unknown; data?: unknown },
  fallback = "Request failed"
): string {
  if (response.error !== undefined) {
    return extractErrorMessage(response.error, fallback)
  }

  if (response.data !== undefined && typeof response.data === "object" && response.data !== null) {
    const data = response.data as Record<string, unknown>
    if (data.success === false && typeof data.error === "string") {
      if (typeof data.error === "object") {
        return JSON.stringify(data.error)
      }
      return data.error
    }
  }

  return fallback
}
