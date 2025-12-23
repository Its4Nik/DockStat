import { Elysia } from "elysia"
import { html, Html } from "@elysiajs/html"
import { staticPlugin } from "@elysiajs/static"
import Logger from "@dockstat/logger"
import { initDatabase } from "./db"
import { createApiRoutes } from "./routes/api"
import { createPageRoutes } from "./routes/pages"

const _ = Html

const logger = new Logger("Verification-Server")

// Configuration
const PORT = process.env.VERIFICATION_PORT ? Number(process.env.VERIFICATION_PORT) : 3100
const DB_PATH = process.env.VERIFICATION_DB_PATH || "verification.db"

logger.info("Starting DockStore Verification Server...")

// Initialize database
const db = initDatabase(DB_PATH)

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

  // API routes
  .use(createApiRoutes(db))

  // Page routes
  .use(createPageRoutes(db))

  // Health check endpoint
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
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
            <p class="text-sm text-gray-500 mb-8">{errorMessage}</p>
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
logger.info(`🔌 API: http://localhost:${PORT}/api`)
logger.info(`💾 Database: ${DB_PATH}`)

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
