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

    // Check for description field (DockStatErrorBody uses this instead of error/message)
    if (typeof err.description === "string" && err.description.trim()) {
      return err.description.trim()
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

      // Check for description in nested DockStatErrorBody
      if (typeof nestedError.description === "string" && nestedError.description.trim()) {
        return nestedError.description.trim()
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

      if (typeof nestedValue.description === "string" && nestedValue.description.trim()) {
        return nestedValue.description.trim()
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

      if (typeof nestedData.description === "string" && nestedData.description.trim()) {
        return nestedData.description.trim()
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
 */
export function extractEdenError(
  response: { status?: number; error?: unknown; data?: unknown },
  fallback = "An unexpected error occurred"
): string {
  // Check if the response itself is a DockStatErrorBody-like object (has description)
  if (
    typeof response === "object" &&
    response !== null &&
    typeof (response as Record<string, unknown>).description === "string"
  ) {
    const desc = (response as Record<string, unknown>).description as string
    if (desc.trim()) return desc.trim()
  }

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

    // Check for description in data (DockStatErrorBody)
    if (typeof data.description === "string" && data.description.trim()) {
      return data.description.trim()
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

  // Handle Eden error structure with value wrapper
  if (typeof error === "object" && "value" in error) {
    const edenError = error as EdenElysiaError
    const value = edenError.value

    if (value && typeof value === "object") {
      // Handle Elysia validation errors
      if (value.type === "validation") {
        // Try to get summary first (most descriptive)
        if (typeof value.summary === "string" && value.summary.trim()) {
          return value.summary.trim()
        }

        // Try message
        if (typeof value.message === "string" && value.message.trim()) {
          return value.message.trim()
        }

        // Try to extract from errors array
        if (Array.isArray(value.errors) && value.errors.length > 0) {
          const firstError = value.errors[0]
          if (firstError?.summary) {
            return firstError.summary
          }
          if (firstError?.message) {
            return firstError.message
          }
        }

        // Construct message from expected/found
        if (value.expected !== undefined && value.found !== undefined) {
          const property = value.property ? ` for ${value.property}` : ""
          return `Validation failed${property}: expected ${JSON.stringify(value.expected)}, got ${JSON.stringify(value.found)}`
        }

        return "Validation failed"
      }

      // Handle worker proxy errors or other typed errors
      if (value.error !== undefined) {
        return extractErrorMessage(value.error, fallback)
      }

      // Try message field
      if (typeof value.message === "string" && value.message.trim()) {
        return value.message.trim()
      }
    }
  }

  // Fall back to standard error extraction
  return extractErrorMessage(error, fallback)
}

// ─── DockStat Error System ────────────────────────────────────────────────────

/**
 * Machine-readable error codes for DockStat errors.
 * Combines standard HTTP-style codes with domain-specific codes.
 */
export enum DockStatErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  VALIDATION = "VALIDATION",
  INTERNAL = "INTERNAL",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  PARSE = "PARSE",
  TIMEOUT = "TIMEOUT",
  DOCKER = "DOCKER",
  DATABASE = "DATABASE",
  AUTH = "AUTH",
  PLUGIN = "PLUGIN",
}

/**
 * Structured detail for each error field.
 * Used to provide fine-grained information about what went wrong.
 */
export interface DockStatErrorDetail {
  field?: string
  message: string
  value?: unknown
  expected?: string
}

/**
 * The JSON body sent from the API to the frontend.
 * This is the canonical error response format.
 */
export interface DockStatErrorBody {
  /** Machine-readable error code */
  code: DockStatErrorCode
  /** Human-readable error description */
  description: string
  /** Structured details about what went wrong */
  details?: DockStatErrorDetail[]
  /** The request ID for tracking */
  reqId?: string
  /** HTTP status code */
  status: number
  /** ISO timestamp */
  timestamp: string
  /** The request path */
  path?: string
}

/**
 * DockStat error class for backend use.
 * Thrown in route handlers and caught by Elysia's onError handler.
 *
 * Elysia reads the `.status` property from error classes to determine
 * the HTTP response code.
 */
export class DockStatError extends Error {
  readonly code: DockStatErrorCode
  readonly status: number
  readonly details?: DockStatErrorDetail[]
  readonly reqId?: string
  readonly path?: string
  readonly timestamp: string

  constructor(opts: {
    code?: DockStatErrorCode
    description: string
    details?: DockStatErrorDetail[]
    status?: number
    reqId?: string
    path?: string
  }) {
    super(opts.description)
    this.name = "DockStatError"
    this.code = opts.code ?? DockStatErrorCode.INTERNAL
    this.status = opts.status ?? 500
    this.details = opts.details
    this.reqId = opts.reqId
    this.path = opts.path
    this.timestamp = new Date().toISOString()
  }

  /** Serialize to the API response body */
  toBody(): DockStatErrorBody {
    return {
      code: this.code,
      description: this.message,
      details: this.details,
      path: this.path,
      reqId: this.reqId,
      status: this.status,
      timestamp: this.timestamp,
    }
  }

  /** Create from a plain body (for deserialization on frontend) */
  static fromBody(body: DockStatErrorBody): DockStatError {
    return new DockStatError({
      code: body.code,
      description: body.description,
      details: body.details,
      path: body.path,
      reqId: body.reqId,
      status: body.status,
    })
  }
}

/**
 * Type guard to check if a value is a DockStatError instance.
 */
export function isDockStatError(value: unknown): value is DockStatError {
  return value instanceof DockStatError
}

/**
 * Type guard to check if an unknown value is a DockStatErrorBody.
 * Validates the required fields: code, description, status, timestamp.
 */
export function isDockStatErrorBody(value: unknown): value is DockStatErrorBody {
  if (value === null || value === undefined || typeof value !== "object") {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.code === "string" &&
    Object.values(DockStatErrorCode).includes(obj.code as DockStatErrorCode) &&
    typeof obj.description === "string" &&
    typeof obj.status === "number" &&
    typeof obj.timestamp === "string"
  )
}

/**
 * Extract a DockStatErrorBody from various Eden error shapes.
 *
 * Handles:
 * - Raw `DockStatErrorBody` objects
 * - Eden's `{ error: DockStatErrorBody }` wrapper
 * - Nested structures like `{ value: { error: DockStatErrorBody } }`
 * - `DockStatError` instances (serializes to body)
 *
 * @param error - The error value to extract from
 * @returns A DockStatErrorBody if one can be found, or undefined
 */
export function extractDockStatError(error: unknown): DockStatErrorBody | undefined {
  if (error === null || error === undefined) {
    return undefined
  }

  // Handle DockStatError instances
  if (error instanceof DockStatError) {
    return error.toBody()
  }

  // Handle raw DockStatErrorBody
  if (isDockStatErrorBody(error)) {
    return error
  }

  if (typeof error !== "object") {
    return undefined
  }

  const obj = error as Record<string, unknown>

  // Handle Eden error structure: { status, error: DockStatErrorBody }
  if (obj.error !== null && obj.error !== undefined && typeof obj.error === "object") {
    if (isDockStatErrorBody(obj.error)) {
      return obj.error
    }

    // Check nested: error.error or error.message patterns inside Eden's error wrapper
    const nestedError = obj.error as Record<string, unknown>
    if (typeof nestedError.error === "object" && nestedError.error !== null) {
      if (isDockStatErrorBody(nestedError.error)) {
        return nestedError.error
      }
    }
  }

  // Handle Eden Elysia error structure: { status, value: DockStatErrorBody }
  if (obj.value !== null && obj.value !== undefined && typeof obj.value === "object") {
    if (isDockStatErrorBody(obj.value)) {
      return obj.value
    }

    // Check for value.error wrapper
    const nestedValue = obj.value as Record<string, unknown>
    if (nestedValue.error !== null && nestedValue.error !== undefined) {
      if (isDockStatErrorBody(nestedValue.error)) {
        return nestedValue.error
      }
    }
  }

  // Handle API response wrapper: { success: false, error: DockStatErrorBody }
  if (obj.success === false && obj.error !== undefined) {
    if (isDockStatErrorBody(obj.error)) {
      return obj.error
    }
  }

  return undefined
}
