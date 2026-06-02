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

  if (typeof (error as { value?: { error?: string } })?.value?.error === "string") {
    return (error as { value?: { error?: string } })?.value?.error || fallback
  }
  if (error instanceof Error) {
    // Handle Error instances
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
    error: extractErrorMessage(error),
    success: false,
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
 * Extracts a readable error message from an Eden response.
 *
 * Supports multiple failure formats:
 * - thrown errors
 * - Eden `{ error }` responses
 * - Elysia validation errors (type: "validation")
 * - API `{ success: false, error: string }` responses
 *
 * @param response Eden response-like object
 * @param response.status HTTP status (optional)
 * @param response.error Thrown or returned error
 * @param response.data Response body
 * @param fallback Fallback message if no readable error exists
 *
 * @returns Human readable error message
 *
 * @example
 * extractEdenError({ error: new Error("Invalid token") })
 * // => "Invalid token"
 *
 * extractEdenError({ data: { success: false, error: "User not found" } })
 * // => "User not found"
 *
 * extractEdenError({ error: { value: { type: "validation", summary: "Expected string with minimum length of 8" } } })
 * // => "Expected string with minimum length of 8"
 */
export function extractEdenError(
  response: { status?: number; error?: unknown; data?: unknown } | string | Error,
  fallback = "Request failed"
): string {
  // Handle direct string input (already an error message)
  if (typeof response === "string") {
    return response.trim() || fallback
  }

  // Handle Error objects directly
  if (response instanceof Error) {
    return response.message || fallback
  }

  // Handle objects
  if (typeof response === "object" && response !== null) {
    // Handle Eden's raw error structure directly: { status, value: { type, ... } }
    // This is what Eden returns when a validation error occurs
    if ("value" in response) {
      return handleElysiaError(response, fallback)
    }

    // Handle validation errors directly (type: "validation")
    // This handles cases where the ElysiaErrorValue is passed without a wrapper
    if ("type" in response) {
      return handleElysiaError(response, fallback)
    }

    // Handle Eden error responses with error property
    if ("error" in response && response.error !== undefined) {
      return handleElysiaError(response.error, fallback)
    }

    // Handle API error responses with data property
    if (
      "data" in response &&
      response.data !== undefined &&
      typeof response.data === "object" &&
      response.data !== null
    ) {
      const data = response.data as Record<string, unknown>
      if (data.success === false && typeof data.error === "string") {
        return data.error
      }
      // Also handle nested error objects
      if (data.success === false && data.error !== null && typeof data.error === "object") {
        return handleElysiaError(data.error, fallback)
      }
      // Handle data that is itself an error with value
      if ("value" in data) {
        return handleElysiaError(data, fallback)
      }
    }

    // Handle objects with summary property (common in Elysia validation errors)
    if (
      "summary" in response &&
      typeof (response as Record<string, unknown>).summary === "string"
    ) {
      return ((response as Record<string, unknown>).summary as string).trim() || fallback
    }

    // Handle objects with message property
    if (
      "message" in response &&
      typeof (response as Record<string, unknown>).message === "string"
    ) {
      return ((response as Record<string, unknown>).message as string).trim() || fallback
    }
  }

  return fallback
}

/**
 * Eden error value structure from Elysia
 * When Eden receives an error response, it wraps it in a value object
 */
export interface ElysiaErrorValue {
  type: "validation" | "error" | string
  error?: unknown
  message?: string
  on?: string
  summary?: string
  property?: string
  expected?: unknown
  found?: unknown
  errors?: Array<{
    summary?: string
    type?: number
    schema?: unknown
    path?: string
    value?: unknown
    message?: string
  }>
}

/**
 * Eden error structure with value wrapper
 */
export interface EdenElysiaError {
  status: number
  value: ElysiaErrorValue
}

/**
 * Handle Elysia errors from Eden treaty responses
 *
 * This function properly extracts error messages from:
 * - Elysia validation errors (type: "validation")
 * - Worker proxy errors (type: "error")
 * - Standard API error responses
 *
 * @param error - The error object from Eden response (res.error)
 * @param fallback - Fallback error message
 * @returns Extracted error message string
 *
 * @example
 * ```ts
 * const res = await ServerAPI.docker.client.register.post({ ... })
 * if (res.error) {
 *   return { success: false, error: handleElysiaError(res.error) }
 * }
 * ```
 */
export function handleElysiaError(error: unknown, fallback = "Request failed"): string {
  if (error === null || error === undefined) {
    return fallback
  }

  // Handle strings directly
  if (typeof error === "string") {
    return error.trim() || fallback
  }

  if (typeof error !== "object") {
    return fallback
  }

  const errObj = error as Record<string, unknown>

  // Check if this is already the ElysiaErrorValue (has type property)
  // This handles cases where the value is passed directly without a wrapper
  if ("type" in errObj && errObj.type === "validation") {
    // Try to get summary first (most descriptive)
    if (typeof errObj.summary === "string" && errObj.summary.trim()) {
      return errObj.summary.trim()
    }

    // Try message
    if (typeof errObj.message === "string" && errObj.message.trim()) {
      return errObj.message.trim()
    }

    // Try to extract from errors array
    if (Array.isArray(errObj.errors) && errObj.errors.length > 0) {
      const firstError = errObj.errors[0] as Record<string, unknown> | undefined
      if (firstError?.summary && typeof firstError.summary === "string") {
        return firstError.summary.trim()
      }
      if (firstError?.message && typeof firstError.message === "string") {
        return firstError.message.trim()
      }
    }

    // Construct message from expected/found
    if (errObj.expected !== undefined && errObj.found !== undefined) {
      const property =
        errObj.property && typeof errObj.property === "string" ? ` for ${errObj.property}` : ""
      return `Validation failed${property}: expected ${JSON.stringify(errObj.expected)}, got ${JSON.stringify(errObj.found)}`
    }

    return "Validation failed"
  }

  // Handle Eden error structure with value wrapper
  if ("value" in errObj) {
    const value = errObj.value

    if (value && typeof value === "object") {
      // Recursively handle the value object
      return handleElysiaError(value, fallback)
    }
  }

  // Handle error property (common in some error structures)
  if ("error" in errObj && errObj.error !== undefined) {
    return extractErrorMessage(errObj.error, fallback)
  }

  // Try summary/message fields directly
  if ("summary" in errObj && typeof errObj.summary === "string" && errObj.summary.trim()) {
    return errObj.summary.trim()
  }

  if ("message" in errObj && typeof errObj.message === "string" && errObj.message.trim()) {
    return errObj.message.trim()
  }

  // Fall back to standard error extraction
  return extractErrorMessage(error, fallback)
}
