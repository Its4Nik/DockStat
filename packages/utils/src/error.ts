/**
 * Error extraction and handling utilities
 * @module @dockstat/utils/error
 */

/**
 * Standard API error response structure (legacy + new format)
 */
export interface ApiErrorResponse {
  success: false
  error: string | { code: string; message: string; details?: unknown }
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
 * Check if a value is an ApiErrorResponse
 */
export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    (value as Record<string, unknown>).success === false &&
    "error" in value
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
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred"
): string {
  if (error === null || error === undefined) return fallback
  if (typeof error === "string") return error.trim() || fallback
  if (error instanceof Error) return error.message || fallback

  if (typeof error === "object") {
    const err = error as Record<string, unknown>

    // New DockStat error format: { code, message, details? }
    if (err.message !== null && typeof err.message === "string" && err.message.trim()) {
      return err.message.trim()
    }

    if (typeof err.error === "string" && err.error.trim()) {
      return err.error.trim()
    }

    // Nested error: { error: { message: "..." } }
    if (err.error !== null && typeof err.error === "object" && err.error !== undefined) {
      const nested = err.error as Record<string, unknown>
      if (typeof nested.message === "string" && nested.message.trim()) {
        return nested.message.trim()
      }
      if (typeof nested.error === "string" && nested.error.trim()) {
        return nested.error.trim()
      }
    }

    // Nested value (Eden wraps)
    if (err.value !== null && typeof err.value === "object" && err.value !== undefined) {
      const nested = err.value as Record<string, unknown>
      if (typeof nested.message === "string" && nested.message.trim()) {
        return nested.message.trim()
      }
      if (typeof nested.summary === "string" && nested.summary.trim()) {
        return nested.summary.trim()
      }
    }

    // data wrapper
    if (err.data !== null && typeof err.data === "object" && err.data !== undefined) {
      const nested = err.data as Record<string, unknown>
      if (typeof nested.message === "string" && nested.message.trim()) return nested.message.trim()
      if (typeof nested.error === "string" && nested.error.trim()) return nested.error.trim()
    }

    if (err.cause !== null && err.cause !== undefined) {
      const causeMessage = extractErrorMessage(err.cause, "")
      if (causeMessage) return causeMessage
    }
  }

  return fallback
}

/**
 * Create a standardized API error response
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
 */
export function createApiSuccessResponse<T>(data?: T, message?: string): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = { success: true }
  if (data !== undefined) response.data = data
  if (message) response.message = message
  return response
}

/**
 * Wrap a function to catch and transform errors into API error responses
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
      return createApiErrorResponse(error, { message: fallbackMessage })
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

// ─── DockStat unified error extraction ──────────────────────────────
//
// All API errors now use the consistent format:
//   { success: false, error: { code, message, details? }, path, timestamp }
//
// This function extracts a human-readable message from that format
// AND falls back gracefully for legacy / third-party shapes.

/**
 * Extracts a human-readable error message from any Eden/API response.
 *
 * Priority order:
 *  1. New format: `response.error.message`  (DockStatErrorResponse)
 *  2. Legacy flat:  `response.error` string
 *  3. Validation:   `error.value.summary` / `error.value.errors[0].message`
 *  4. Nested data:  `response.data.error`
 *  5. String / Error input
 *  6. Fallback
 */
export function extractEdenError(
  response: { status?: number; error?: unknown; data?: unknown } | string | Error,
  fallback = "Request failed"
): string {
  // Direct string
  if (typeof response === "string") return response.trim() || fallback

  // Error instance
  if (response instanceof Error) return response.message || fallback

  // Not an object – give up
  if (typeof response !== "object" || response === null) return fallback

  // ── New DockStatErrorResponse format ──
  // Shape: { error: { code, message, details? }, ... }
  if ("error" in response && response.error !== null && typeof response.error === "object") {
    const errObj = response.error as Record<string, unknown>

    // New format: { code, message }
    if (typeof errObj.message === "string" && errObj.message.trim()) {
      // Also check for field-level details to append
      const details = Array.isArray(errObj.details) ? errObj.details : []
      if (details.length > 0) {
        const fieldMsgs = details
          .map((d: Record<string, unknown>) => {
            const field = typeof d.field === "string" ? d.field : ""
            const msg = typeof d.message === "string" ? d.message : ""
            return field ? `${field}: ${msg}` : msg
          })
          .filter(Boolean)
        if (fieldMsgs.length > 0) return fieldMsgs.join(", ")
      }
      return errObj.message.trim()
    }

    // Legacy string error inside error property
    if (typeof errObj.error === "string" && errObj.error.trim()) {
      return errObj.error.trim()
    }
  }

  // ── Legacy flat string error ──
  if ("error" in response && typeof response.error === "string" && response.error.trim()) {
    return response.error.trim()
  }

  // ── Eden validation wrapper: { value: { type: "validation", ... } } ──
  if ("value" in response) {
    return extractFromValidationValue(response, fallback)
  }

  // ── Data wrapper ──
  if ("data" in response && response.data !== null && typeof response.data === "object") {
    const data = response.data as Record<string, unknown>

    // New format inside data
    if (data.error !== null && typeof data.error === "object" && data.error !== undefined) {
      const errObj = data.error as Record<string, unknown>
      if (typeof errObj.message === "string" && errObj.message.trim()) {
        return errObj.message.trim()
      }
    }

    if (typeof data.error === "string" && (data.error as string).trim()) {
      return (data.error as string).trim()
    }
  }

  // ── Direct summary / message on the object ──
  if ("summary" in response && typeof (response as Record<string, unknown>).summary === "string") {
    return ((response as Record<string, unknown>).summary as string).trim() || fallback
  }
  if ("message" in response && typeof (response as Record<string, unknown>).message === "string") {
    return ((response as Record<string, unknown>).message as string).trim() || fallback
  }

  return fallback
}

/**
 * Extract from Eden's validation value wrapper
 */
function extractFromValidationValue(wrapper: Record<string, unknown>, fallback: string): string {
  const value = wrapper.value
  if (value === null || typeof value !== "object") return fallback

  const v = value as Record<string, unknown>

  // summary is the most useful
  if (typeof v.summary === "string" && v.summary.trim()) return v.summary.trim()
  if (typeof v.message === "string" && v.message.trim()) return v.message.trim()

  // errors array
  if (Array.isArray(v.errors) && v.errors.length > 0) {
    const first = v.errors[0] as Record<string, unknown> | undefined
    if (first?.summary && typeof first.summary === "string") return first.summary.trim()
    if (first?.message && typeof first.message === "string") return first.message.trim()
  }

  // expected / found
  if (v.expected !== undefined && v.found !== undefined) {
    const prop = typeof v.property === "string" ? ` for ${v.property}` : ""
    return `Validation failed${prop}: expected ${JSON.stringify(v.expected)}, got ${JSON.stringify(v.found)}`
  }

  return fallback
}

/**
 * Eden error value structure from Elysia
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

export interface EdenElysiaError {
  status: number
  value: ElysiaErrorValue
}

/**
 * Handle Elysia errors from Eden treaty responses (kept for compat)
 * @deprecated Use extractEdenError instead – it now handles all cases
 */
export function handleElysiaError(error: unknown, fallback = "Request failed"): string {
  return extractEdenError(error as Record<string, unknown>, fallback)
}
