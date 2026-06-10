import { DockStatError, ErrorCode, parseValidationError } from "@dockstat/errors"
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

    // ── DockStatError: our own typed errors ──
    if (error instanceof DockStatError) {
      set.status = error.statusCode
      return error.toResponse(path)
    }

    // ── VALIDATION: Elysia schema validation ──
    if (code === "VALIDATION") {
      const validationError = error as ValidationError

      // Response validation (server-side bug)
      if (validationError.type === "response") {
        set.status = 500
        return {
          error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: "Response validation failed",
          },
          path,
          success: false,
          timestamp,
        }
      }

      // Request validation (client error)
      set.status = 400
      const details = parseValidationError(validationError)

      // Extract a clean, user-facing summary from the first error
      const message = details.length > 0 ? details[0].message : "Validation failed"

      return {
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          details,
          message,
        },
        path,
        success: false,
        timestamp,
      }
    }

    // ── PARSE: malformed JSON etc. ──
    if (code === "PARSE") {
      set.status = 400
      return {
        error: {
          code: ErrorCode.BAD_REQUEST,
          message: "Invalid request format",
        },
        path,
        success: false,
        timestamp,
      }
    }

    // ── NOT_FOUND ──
    if (code === "NOT_FOUND") {
      set.status = 404
      return {
        error: {
          code: ErrorCode.NOT_FOUND,
          message: `Cannot ${request.method} ${path}`,
        },
        path,
        success: false,
        timestamp,
      }
    }

    // ── INTERNAL_SERVER_ERROR ──
    if (code === "INTERNAL_SERVER_ERROR") {
      const errorMessage = extractErrorMessage(error, "An unexpected error occurred")
      set.status = 500
      return {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: errorMessage,
        },
        path,
        success: false,
        timestamp,
      }
    }

    // ── Fallback ──
    set.status = 500
    const errorMessage = extractErrorMessage(error, "An unexpected error occurred")
    console.error("Unhandled error:", { code, error, path, timestamp })

    return {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: errorMessage,
      },
      path,
      success: false,
      timestamp,
    }
  })
  .as("global")
