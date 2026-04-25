export const BASE_URL = Bun.env.BASE_URL ? Bun.env.BASE_URL : "http://localhost:3030/api/v2/auth"
export const FRONTEND_URL = Bun.env.FRONTEND_URL ? Bun.env.FRONTEND_URL : "http://localhost:5173"
export const CRYPTO_SECRET = Bun.env.CRYPTO_SECRET ? Bun.env.CRYPTO_SECRET : "PLEASE-CHANGE-ME"

const DEVELOPMENT_JWT_SECRET = "dev-only-insecure-jwt-secret-do-not-use-in-production"

const rawJwtSecret = Bun.env.JWT_SECRET
const isDevelopment = Bun.env.NODE_ENV === "development"

if (!rawJwtSecret && !isDevelopment) {
  throw new Error(
    "JWT_SECRET environment variable is required and must not be empty. " +
      "Set JWT_SECRET to a secure random string (at least 32 characters) before starting the application. " +
      "Note: A fallback default is only available when NODE_ENV is 'development'."
  )
}

if (!rawJwtSecret && isDevelopment) {
  console.warn(
    "[auth] WARNING: Using development-only JWT_SECRET fallback. " +
      "This is insecure and must NOT be used in production. " +
      "Set the JWT_SECRET environment variable for production deployments."
  )
}

export const JWT_SECRET = new TextEncoder().encode(rawJwtSecret || DEVELOPMENT_JWT_SECRET)
