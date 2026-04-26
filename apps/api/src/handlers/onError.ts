import {
  type DockStatErrorBody,
  DockStatErrorCode,
  type DockStatErrorDetail,
  extractErrorMessage,
  isDockStatError,
} from "@dockstat/utils"
import Elysia, { type ValidationError } from "elysia"
import { AuthHandler } from "../auth"
import BaseLogger from "../logger"

const logger = BaseLogger.spawn("Error")

/**
 * Parse an Elysia ValidationError into structured DockStatErrorDetail[].
 */
function parseValidationDetails(ve: ValidationError): DockStatErrorDetail[] {
  const details: DockStatErrorDetail[] = []
  try {
    const parsed = JSON.parse(ve.message)
    if (Array.isArray(parsed.errors)) {
      for (const e of parsed.errors) {
        details.push({
          expected: e.schema ? JSON.stringify(e.schema) : undefined,
          field:
            typeof e.path === "string" ? e.path.replaceAll("/", ".").replace(/^\./, "") : undefined,
          message: String(e.summary ?? e.message ?? "Validation failed"),
          value: e.value,
        })
      }
    }
  } catch {
    details.push({ message: ve.message })
  }
  return details
}

export const errorHandler = new Elysia()
  .onError(({ code, error, set, request }) => {
    const path = new URL(request.url).pathname
    const reqId = AuthHandler.getStateMap().get(request)?.reqId
    const timestamp = new Date().toISOString()

    // ── DockStatError: already fully structured ──────────────────────
    if (isDockStatError(error)) {
      logger.error(`[${error.code}] ${error.message}`, reqId)
      set.status = error.status
      return {
        ...error.toBody(),
        path: error.path ?? path,
        reqId: error.reqId ?? reqId,
      } satisfies DockStatErrorBody
    }

    // ── VALIDATION: schema validation errors ─────────────────────────
    if (code === "VALIDATION") {
      const ve = error as ValidationError

      // Response validation failure = server bug
      if (ve.type === "response") {
        logger.error(`Response validation failed on ${path}`, reqId)
        set.status = 500
        return {
          code: DockStatErrorCode.INTERNAL,
          description: "Response validation failed",
          details: [{ message: "The server produced an unexpected response shape" }],
          path,
          reqId,
          status: 500,
          timestamp,
        } satisfies DockStatErrorBody
      }

      logger.error(`Request validation failed on ${path}`, reqId)
      set.status = 400

      // Production: hide field-level details
      if (process.env.NODE_ENV === "production") {
        return {
          code: DockStatErrorCode.VALIDATION,
          description: "Validation failed",
          path,
          reqId,
          status: 400,
          timestamp,
        } satisfies DockStatErrorBody
      }

      // Dev: full structured details
      return {
        code: DockStatErrorCode.VALIDATION,
        description: "Validation failed",
        details: parseValidationDetails(ve),
        path,
        reqId,
        status: 400,
        timestamp,
      } satisfies DockStatErrorBody
    }

    // ── PARSE: malformed request body ────────────────────────────────
    if (code === "PARSE") {
      logger.error(`Parse error on ${path}`, reqId)
      set.status = 400
      return {
        code: DockStatErrorCode.PARSE,
        description: "Invalid request format",
        path,
        reqId,
        status: 400,
        timestamp,
      } satisfies DockStatErrorBody
    }

    // ── NOT_FOUND ────────────────────────────────────────────────────
    if (code === "NOT_FOUND") {
      logger.error(`Not found: ${request.method} ${path}`, reqId)
      set.status = 404
      return {
        code: DockStatErrorCode.NOT_FOUND,
        description: `Cannot ${request.method} ${path}`,
        path,
        reqId,
        status: 404,
        timestamp,
      } satisfies DockStatErrorBody
    }

    // ── INTERNAL_SERVER_ERROR ────────────────────────────────────────
    if (code === "INTERNAL_SERVER_ERROR") {
      const msg = extractErrorMessage(error, "An unexpected error occurred")
      logger.error(`Internal server error on ${path}: ${msg}`, reqId)
      set.status = 500
      return {
        code: DockStatErrorCode.INTERNAL,
        description: msg,
        path,
        reqId,
        status: 500,
        timestamp,
      } satisfies DockStatErrorBody
    }

    // ── Fallback: unknown error code ─────────────────────────────────
    const msg = extractErrorMessage(error, "An unexpected error occurred")
    logger.error(`Unhandled error (${code}) on ${path}: ${msg}`, reqId)
    set.status = 500
    return {
      code: DockStatErrorCode.INTERNAL,
      description: msg,
      path,
      reqId,
      status: 500,
      timestamp,
    } satisfies DockStatErrorBody
  })
  .as("global")
