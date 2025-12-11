import Elysia, { type ValidationError } from "elysia"

export const errorHandler = new Elysia().onError(({ code, error, set, request }) => {
  const path = new URL(request.url).pathname
  const timestamp = new Date().toISOString()

  // Handle validation errors
  if (code === "VALIDATION") {
    const validationError = error as ValidationError

    // Check if it's a response validation error (server-side)
    if (validationError.type === "response") {
      set.status = 500

      return {
        error: "Response validation failed",
        message: validationError.message,
        path,
        timestamp,
        ...(process.env.NODE_ENV === "development" && {
          detail: validationError.all,
        }),
      }
    }

    // Request validation errors (client-side)
    set.status = 400

    // In production, hide validation details for security
    if (process.env.NODE_ENV === "production") {
      return {
        error: "Validation failed",
        message: validationError.message,
        path,
        timestamp,
      }
    }

    // In development, show details
    return {
      error: "Validation failed",
      message: validationError.message,
      path,
      timestamp,
      detail: validationError.all,
    }
  }

  // Handle parser errors (malformed JSON, etc.)
  if (code === "PARSE") {
    set.status = 400
    return {
      error: "Parse error",
      message: "Invalid request format",
      path,
      timestamp,
    }
  }

  // Handle not found errors
  if (code === "NOT_FOUND") {
    set.status = 404
    return {
      error: "Not found",
      message: `Cannot ${request.method} ${path}`,
      path,
      timestamp,
    }
  }

  // Handle internal server errors
  if (code === "INTERNAL_SERVER_ERROR") {
    set.status = 500
    return {
      error: "Internal server error",
      message: "An unexpected error occurred",
      path,
      timestamp,
    }
  }

  // Handle unknown errors
  set.status = 500
  console.error("Unhandled error:", { code, error, path, timestamp })

  return {
    error: "Unknown error",
    message: "An unexpected error occurred",
    path,
    timestamp,
  }
})
