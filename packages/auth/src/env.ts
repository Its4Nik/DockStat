const DEVELOPMENT_JWT_SECRET = "dev-only-insecure-jwt-secret-do-not-use-in-production"

function readSecret(): string {
  const raw = Bun.env.DOCKSTAT_AUTH_JWT_SECRET ?? ""
  const isDevelopment = Bun.env.NODE_ENV !== "production"

  if (!raw) {
    if (!isDevelopment) {
      throw new Error(
        "DOCKSTAT_AUTH_JWT_SECRET environment variable is required and must not be empty. " +
          "Set it to a secure random string (at least 32 characters) before starting the application."
      )
    }

    console.warn(
      "[auth] WARNING: Using development-only JWT secret fallback. " +
        "This is insecure and must NOT be used in production."
    )
    return DEVELOPMENT_JWT_SECRET
  }

  if (raw.length < 32) {
    console.warn(
      `[auth] WARNING: DOCKSTAT_AUTH_JWT_SECRET is shorter than 32 characters (${raw.length}). ` +
        "Use a longer secret for adequate security."
    )
  }

  return raw
}

export const AUTH_ISSUER = "dockstat"
export const AUTH_AUDIENCE = "dockstat"
export const WS_TOKEN_AUDIENCE = "dockstat-ws"

export const BASE_URL = Bun.env.BASE_URL || "http://localhost:3000/api/v2/auth"
export const FRONTEND_URL = Bun.env.FRONTEND_URL || "http://localhost:3000"

export const CRYPTO_SECRET = Bun.env.DOCKSTAT_AUTH_CRYPTO_SECRET || "PLEASE-CHANGE-ME"

export const JWT_SECRET = new TextEncoder().encode(readSecret())
