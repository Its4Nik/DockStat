import Logger from "@dockstat/logger"
import { Html, html } from "@elysiajs/html"
import { staticPlugin } from "@elysiajs/static"
import { Elysia } from "elysia"
import { db } from "./db"
import { createAuthMiddleware, type AuthConfig } from "./middleware/auth"
import { apiRoutes, compareRoutes, pageRoutes, publicRoutes } from "./routes"

const _ = Html

const logger = new Logger("Verification-Server")

// Configuration
export const PORT = process.env.VERIFICATION_PORT ? Number(process.env.VERIFICATION_PORT) : 3200
const AUTH_ENABLED = process.env.AUTH_ENABLED === "true"

logger.info("Starting DockStore Verification Server...")

// Authentication configuration
const authConfig: Partial<AuthConfig> = {
  enabled: AUTH_ENABLED,
  publicRoutes: [
    // Health check
    "/health",
    // Public dashboard and API
    "/public/*",
    "/api/public/*",
    // Compare API (for plugin validation)
    "/api/compare/*",
    // Static assets
    "/public/*",
  ],
}

// Create Elysia app
const app = new Elysia()
  // HTML plugin for JSX support
  .use(html())

  // Static file serving
  .use(
    staticPlugin({
      assets: "public",
      prefix: "/public",
    })
  )

  // Authentication middleware (applied to all routes)
  .use(createAuthMiddleware(authConfig))

  // Public routes (no authentication required)
  .use(publicRoutes)

  // Compare API routes (public, for plugin validation)
  .group("/api", (app) => app.use(compareRoutes))

  // Protected API routes (authentication required when enabled)
  .use(apiRoutes)

  // Protected page routes (authentication required when enabled)
  .use(pageRoutes)

  // Health check endpoint (always public)
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    authEnabled: AUTH_ENABLED,
  }))

  // Status endpoint for quick checks
  .get("/status", () => ({
    service: "dockstore-verification",
    status: "running",
    uptime: process.uptime(),
  }))

  // Error handling
  .onError(({ code, error, set }) => {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logger.error(`Error [${code}]: ${errorMessage}`)

    if (code === "NOT_FOUND") {
      set.status = 404
      return (
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>404 - Not Found</title>
            <script src="https://cdn.tailwindcss.com" />
          </head>
          <body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-6xl font-bold text-gray-600 mb-4">404</h1>
              <p class="text-xl text-gray-400 mb-8">Page not found</p>
              <div class="flex gap-4 justify-center">
                <a
                  href="/"
                  class="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/public"
                  class="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Public Status
                </a>
              </div>
            </div>
          </body>
        </html>
      )
    }

    if (code === "VALIDATION") {
      set.status = 400
      return {
        error: "Validation Error",
        message: errorMessage,
        code: "VALIDATION_ERROR",
      }
    }

    set.status = 500
    return (
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>500 - Server Error</title>
          <script src="https://cdn.tailwindcss.com" />
        </head>
        <body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-red-600 mb-4">500</h1>
            <p class="text-xl text-gray-400 mb-4">Something went wrong</p>
            <p safe class="text-sm text-gray-500 mb-8">
              {errorMessage}
            </p>
            <a
              href="/"
              class="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go Home
            </a>
          </div>
        </body>
      </html>
    )
  })

  // Start server
  .listen(PORT)

logger.info(`🚀 DockStore Verification Server running at http://localhost:${PORT}`)
logger.info(`📊 Dashboard: http://localhost:${PORT}/`)
logger.info(`🌐 Public Status: http://localhost:${PORT}/public`)
logger.info(`🔌 API: http://localhost:${PORT}/api`)
logger.info(`🔍 Compare API: http://localhost:${PORT}/api/compare`)
logger.info(`🔐 Authentication: ${AUTH_ENABLED ? "ENABLED" : "DISABLED"}`)

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down...")
  db.close()
  process.exit(0)
})

process.on("SIGTERM", () => {
  logger.info("Shutting down...")
  db.close()
  process.exit(0)
})

export default app
