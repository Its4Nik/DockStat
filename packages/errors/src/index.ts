/**
 * DockStat Error Codes
 * Machine-readable codes for programmatic error handling
 */
export const ErrorCode = {
  ALREADY_EXISTS: "ALREADY_EXISTS",

  // Request/Server errors (5xxx)
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
  DATABASE_ERROR: "DATABASE_ERROR",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Resource errors (3xxx)
  NOT_FOUND: "NOT_FOUND",
  REGISTRATION_DISABLED: "REGISTRATION_DISABLED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  // Authentication errors (1xxx)
  UNAUTHORIZED: "UNAUTHORIZED",

  // Validation errors (2xxx)
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

/**
 * Human-readable error messages for each code
 */
const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: "Authentication required",
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid username or password",
  [ErrorCode.TOKEN_EXPIRED]: "Session expired, please login again",
  [ErrorCode.TOKEN_INVALID]: "Invalid authentication token",
  [ErrorCode.FORBIDDEN]: "Access denied",
  [ErrorCode.REGISTRATION_DISABLED]: "Registration is currently disabled",

  [ErrorCode.VALIDATION_FAILED]: "Validation failed",
  [ErrorCode.INVALID_INPUT]: "Invalid input provided",
  [ErrorCode.MISSING_REQUIRED_FIELD]: "Required field is missing",

  [ErrorCode.NOT_FOUND]: "Resource not found",
  [ErrorCode.ALREADY_EXISTS]: "Resource already exists",
  [ErrorCode.CONFLICT]: "Conflict with existing resource",

  [ErrorCode.BAD_REQUEST]: "Bad request",
  [ErrorCode.INTERNAL_ERROR]: "An internal error occurred",
  [ErrorCode.DATABASE_ERROR]: "Database operation failed",
  [ErrorCode.TIMEOUT]: "Request timed out",
  [ErrorCode.SERVICE_UNAVAILABLE]: "Service unavailable",
}

/**
 * Field-level validation error
 */
export interface FieldError {
  /** Field path (e.g., "body.password", "query.page") */
  field: string
  /** Error message */
  message: string
  /** Current value that failed validation */
  value?: unknown
  /** Expected format/constraint */
  expected?: string
}

/**
 * DockStat Error Response structure
 * All API errors should return this format
 */
export interface DockStatErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: FieldError[]
  }
  path: string
  timestamp: string
}

/**
 * DockStat Success Response structure
 */
export interface DockStatSuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

/**
 * Union type for all API responses
 */
export type DockStatResponse<T = unknown> = DockStatSuccessResponse<T> | DockStatErrorResponse

/**
 * DockStat Error - Custom error class for consistent error handling
 *
 * @example
 * ```typescript
 * // Simple usage
 * throw new DockStatError("NOT_FOUND", { message: "User not found" })
 *
 * // With field-level errors
 * throw new DockStatError("VALIDATION_FAILED", {
 *   message: "Invalid input",
 *   details: [
 *     { field: "email", message: "Invalid email format" },
 *     { field: "password", message: "Must be at least 8 characters" },
 *   ]
 * })
 *
 * // In route handler
 * new Elysia()
 *   .get('/user/:id', ({ params, error }) => {
 *     const user = db.getUser(params.id)
 *     if (!user) {
 *       return error(new DockStatError("NOT_FOUND", {
 *         message: `User ${params.id} not found`
 *       }))
 *     }
 *     return user
 *   })
 * ```
 */
export class DockStatError extends Error {
  /** Machine-readable error code */
  readonly code: ErrorCode

  /** Human-readable message (override default) */
  readonly message: string

  /** Optional field-level validation errors */
  readonly details?: FieldError[]

  /** HTTP status code */
  readonly statusCode: number

  constructor(code: ErrorCode, options?: { message?: string; details?: FieldError[] }) {
    const message = options?.message || DEFAULT_MESSAGES[code] || "An error occurred"
    super(message)

    this.name = "DockStatError"
    this.code = code
    this.message = message
    this.details = options?.details
    this.statusCode = codeToStatus(code)
  }

  /**
   * Convert to API response object
   */
  toResponse(path: string): DockStatErrorResponse {
    return {
      error: {
        code: this.code,
        details: this.details,
        message: this.message,
      },
      path,
      success: false,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Check if this is an authentication error
   */
  get isAuthError(): boolean {
    return (
      this.code.startsWith("AUTH") ||
      this.code === ErrorCode.UNAUTHORIZED ||
      this.code === ErrorCode.FORBIDDEN
    )
  }

  /**
   * Check if this is a validation error
   */
  get isValidationError(): boolean {
    return this.code.startsWith("VAL") || this.code === ErrorCode.VALIDATION_FAILED
  }

  /**
   * Check if this is a not found error
   */
  get isNotFoundError(): boolean {
    return this.code === ErrorCode.NOT_FOUND
  }
}

/**
 * Map error codes to HTTP status codes
 */
function codeToStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.INVALID_CREDENTIALS:
    case ErrorCode.TOKEN_EXPIRED:
    case ErrorCode.TOKEN_INVALID:
      return 401

    case ErrorCode.FORBIDDEN:
    case ErrorCode.REGISTRATION_DISABLED:
      return 403

    case ErrorCode.NOT_FOUND:
      return 404

    case ErrorCode.ALREADY_EXISTS:
    case ErrorCode.CONFLICT:
      return 409

    case ErrorCode.VALIDATION_FAILED:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.BAD_REQUEST:
      return 400

    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503

    default:
      return 500
  }
}

/**
 * Helper to create a not found error
 */
export function notFound(message: string, details?: FieldError[]): DockStatError {
  return new DockStatError(ErrorCode.NOT_FOUND, { details, message })
}

/**
 * Helper to create a validation error
 */
export function validationError(message: string, details?: FieldError[]): DockStatError {
  return new DockStatError(ErrorCode.VALIDATION_FAILED, { details, message })
}

/**
 * Helper to create an unauthorized error
 */
export function unauthorized(message?: string): DockStatError {
  return new DockStatError(ErrorCode.UNAUTHORIZED, { message })
}

/**
 * Helper to create a conflict error
 */
export function conflict(message: string): DockStatError {
  return new DockStatError(ErrorCode.CONFLICT, { message })
}

/**
 * Helper to create a forbidden error
 */
export function forbidden(message?: string): DockStatError {
  return new DockStatError(ErrorCode.FORBIDDEN, { message })
}

/**
 * Type guard to check if a response is an error response
 */
export function isError<T>(response: DockStatResponse<T>): response is DockStatErrorResponse {
  return response.success === false
}

/**
 * Type guard to check if a response is a success response
 */
export function isSuccess<T>(
  response: DockStatResponse<T>
): response is DockStatSuccessResponse<T> {
  return response.success === true
}

/**
 * Convert an Elysia validation error to FieldError array
 */
export function parseValidationError(error: {
  all?: Array<{ path?: string; message?: string; value?: unknown; expected?: unknown }>
  message?: string
}): FieldError[] {
  if (!error?.all?.length) {
    return []
  }

  return error.all.map((e) => ({
    expected: e.expected ? JSON.stringify(e.expected) : undefined,
    field: e.path || "unknown",
    message: e.message || "Validation failed",
    value: e.value,
  }))
}

/**
 * Extract error from various formats
 * Handles: DockStatError, Error, objects with error property, strings
 */
export function extractError(error: unknown, fallback = "An error occurred"): string {
  if (error instanceof DockStatError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error.trim() || fallback
  }

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>

    // Handle DockStatErrorResponse format
    if (
      obj.error &&
      typeof obj.error === "object" &&
      "message" in (obj.error as Record<string, unknown>)
    ) {
      return ((obj.error as Record<string, unknown>).message as string) || fallback
    }

    // Handle simple error object
    if (typeof obj.message === "string") {
      return obj.message
    }

    // Handle stringified JSON in message field
    if (typeof obj.message === "string") {
      try {
        const parsed = JSON.parse(obj.message)
        if (typeof parsed.message === "string") {
          return parsed.message
        }
        if (typeof parsed.summary === "string") {
          return parsed.summary
        }
      } catch {
        // Not JSON, use as-is
      }
    }
  }

  return fallback
}

// Re-export types
export type { DockStatErrorResponse as type }
