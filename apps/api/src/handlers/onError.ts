import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { type ValidationError } from "elysia"
import { AuthHandler } from "../auth"
import BaseLogger from "../logger"

const logger = BaseLogger.spawn("Error")

export const errorHandler = new Elysia()
  .onError(({ code, error, set, request }) => {
    const path = new URL(request.url).pathname
    const timestamp = new Date().toISOString()
    const reqId = AuthHandler.getStateMap().get(request)?.reqId

    logger.error(`Caught an Error on ${path}`, reqId)

    if (code === "VALIDATION") {
      const validationError = error as ValidationError

      // Check if it's a response validation error (server-side)
      if (validationError.type === "response") {
        set.status = 500

        const allErrors: Array<{ [x: string]: string }> = JSON.parse(validationError.message).errors
        const parsedErrors: Array<{ message: string; path: string }> = allErrors.map((e) => {
          const message = String(e.summary)
          const path = String(e.path).replaceAll("/", ".")

          logger.error(`Validation on ${path}: ${path}`)

          return { message, path }
        })

        return {
          error: parsedErrors,
          message: "Response validation failed",
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
          success: false,
          timestamp,
        }
      }

      // In development, show details
      return {
        detail: validationError.all,
        error: "Validation failed",
        message: validationError.message,
        path,
        success: false,
        timestamp,
      }
    }

    // Handle parser errors (malformed JSON, etc.)
    if (code === "PARSE") {
      set.status = 400
      return {
        error: "Parse error",
        message: "Invalid request format",
        path,
        success: false,
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
        success: false,
        timestamp,
      }
    }

    // Handle internal server errors
    if (code === "INTERNAL_SERVER_ERROR") {
      const errorMessage = extractErrorMessage(error, "An unexpected error occurred")
      set.status = 500
      return {
        error: "Internal server error",
        message: errorMessage,
        path,
        success: false,
        timestamp,
      }
    }

    // Handle unknown errors - use the centralized error extraction
    set.status = 500
    const errorMessage = extractErrorMessage(error, "An unexpected error occurred")

    console.error("Unhandled error:", { code, error, path, timestamp })

    return {
      error: errorMessage,
      message: "An unexpected error occurred",
      path,
      success: false,
      timestamp,
    }
  })
  .as("global")
