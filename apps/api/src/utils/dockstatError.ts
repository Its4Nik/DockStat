import type { DockStatErrorDetail } from "@dockstat/utils"
import { DockStatError, DockStatErrorCode } from "@dockstat/utils"

/**
 * Create a bad request error (400)
 */
export function badRequest(
  description: string,
  opts?: { details?: DockStatErrorDetail[]; reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.BAD_REQUEST,
    description,
    details: opts?.details,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 400,
  })
}

/**
 * Create an unauthorized error (401)
 */
export function unauthorized(
  description = "Authentication required",
  opts?: { reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.UNAUTHORIZED,
    description,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 401,
  })
}

/**
 * Create a forbidden error (403)
 */
export function forbidden(
  description: string,
  opts?: { reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.FORBIDDEN,
    description,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 403,
  })
}

/**
 * Create a not found error (404)
 */
export function notFound(
  description: string,
  opts?: { reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.NOT_FOUND,
    description,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 404,
  })
}

/**
 * Create a conflict error (409)
 */
export function conflict(
  description: string,
  opts?: { reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.CONFLICT,
    description,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 409,
  })
}

/**
 * Create a validation error (400)
 */
export function validationError(
  description: string,
  details: DockStatErrorDetail[],
  opts?: { reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.VALIDATION,
    description,
    details,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 400,
  })
}

/**
 * Create an internal server error (500)
 */
export function internalError(
  description: string,
  opts?: { details?: DockStatErrorDetail[]; reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.INTERNAL,
    description,
    details: opts?.details,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 500,
  })
}

/**
 * Create a service unavailable error (503)
 */
export function serviceUnavailable(
  description: string,
  opts?: { reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.SERVICE_UNAVAILABLE,
    description,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 503,
  })
}

/**
 * Create a timeout error (504)
 */
export function timeout(
  description: string,
  opts?: { reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.TIMEOUT,
    description,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 504,
  })
}

/**
 * Create a docker error (500)
 */
export function dockerError(
  description: string,
  opts?: { details?: DockStatErrorDetail[]; reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.DOCKER,
    description,
    details: opts?.details,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 500,
  })
}

/**
 * Create a database error (500)
 */
export function databaseError(
  description: string,
  opts?: { details?: DockStatErrorDetail[]; reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.DATABASE,
    description,
    details: opts?.details,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 500,
  })
}

/**
 * Create an auth error (401)
 */
export function authError(
  description: string,
  opts?: { reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.AUTH,
    description,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 401,
  })
}

/**
 * Create a plugin error (500)
 */
export function pluginError(
  description: string,
  opts?: { details?: DockStatErrorDetail[]; reqId?: string; path?: string }
): DockStatError {
  return new DockStatError({
    code: DockStatErrorCode.PLUGIN,
    description,
    details: opts?.details,
    path: opts?.path,
    reqId: opts?.reqId,
    status: 500,
  })
}
