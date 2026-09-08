/**
 * Custom Bun server entry.
 *
 * Production: single process serving the React Router build, static assets
 * and the WebSocket topic handler (/ws and /api/v2/ws).
 *
 * Development: runs as a WebSocket companion (vite/react-router dev handles
 * HTTP on its own port) and spawns `react-router dev` as a child process so
 * a single `bun run dev` starts both.
 */

import { mkdir } from "node:fs/promises"
import { $} from "bun"
import path from "node:path"
import { BaseLogger } from "~/.server/logger"
import { sleep } from "@dockstat/utils"

const { join } = path

const IS_DEV = process.env.NODE_ENV !== "production"
const HTTP_PORT = Number(Bun.env.PORT || 3000)
const DEV_WS_PORT = Number(Bun.env.DOCKSTAT_WS_PORT || 3030)

async function serveStatic(root: string, request: Request): Promise<Response | null> {
  const url = new URL(request.url)
  if (request.method !== "GET" && request.method !== "HEAD") return null
  if (url.pathname.includes("..")) return null

  const filePath = path.join(root, url.pathname)
  const file = Bun.file(filePath)
  if (!(await file.exists())) return null

  const headers = new Headers({
    "Content-Type": file.type || "application/octet-stream",
  })
  if (url.pathname.startsWith("/assets/")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable")
  } else {
    headers.set("Cache-Control", "public, max-age=3600")
  }
  return new Response(file, { headers })
}

async function main() {
  // Keep runtime artifacts (sqlite db + backups) out of vite's watched root —
  // a DB write inside the project dir would otherwise trigger endless
  // "(ssr) program reload" loops during development.
  const dataDir = join(import.meta.dir, ".dockstat")
  await mkdir(dataDir, { recursive: true })
  Bun.env.DOCKSTAT_DB_PATH ||= join(dataDir, "dockstat.sqlite")
  Bun.env.DOCKSTAT_DB_BACKUP_DIR ||= join(dataDir, ".backups")

  const { DSWS } = await import("./app/.server/singletons/wsHandler")
  await import("./app/.server/bootstrap")

  if (IS_DEV) {
    const startWs = () => {
      Bun.serve({
        fetch: async (request, server) => {
          if (request.url.includes("/ws")) {
            const result = await DSWS.tryUpgrade(request, server)
            if (result === "upgraded") return
            if (result instanceof Response) return result
          }
        },
        port: DEV_WS_PORT,
        websocket: DSWS.websocket,
      })
    }
    BaseLogger.info(`[dev] WebSocket companion listening on ws://localhost:${DEV_WS_PORT}/ws`)

    const vitePort = Number(Bun.env.VITE_PORT || 5173)
    const frontendUrl = Bun.env.FRONTEND_URL || `http://localhost:${vitePort}`

    // Run the react-router dev CLI directly through Bun (not its node-shebang
    // bin) with the `development` export condition pre-enabled. Node can't
    // load our `bun:` server modules, and Bun ignores `--conditions` from
    // NODE_OPTIONS, which would otherwise trigger the CLI's restart loop.
    const { createRequire } = await import("node:module")
    const { dirname, join } = await import("node:path")
    const require = createRequire(import.meta.url)
    const rrCli = join(
      dirname(require.resolve("@react-router/dev/package.json")),
      "dist/cli/index.js"
    )

    const child = Bun.spawn({
      cmd: [process.execPath, "--conditions=development", rrCli, "dev"],
      cwd: import.meta.dir,
      env: {
        ...process.env,
        BASE_URL: Bun.env.BASE_URL || `${frontendUrl}/api/v2/auth`,
        FRONTEND_URL: frontendUrl,
        NODE_ENV: "development",
      },
      stderr: "inherit",
      stdin: "inherit",
      stdout: "inherit",
    })

    await sleep(2000)

    startWs()

    $`/usr/bin/bun x react-router typegen --watch --clearScreen false`.quiet()

    const shutdown = () => {
      child.kill()
      process.exit(0)
    }
    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)
    await child.exited
    process.exit(0)
  }

  // ── Production ──────────────────────────────────────────────────
  Bun.env.FRONTEND_URL ||= `http://localhost:${HTTP_PORT}`
  Bun.env.BASE_URL ||= `${Bun.env.FRONTEND_URL}/api/v2/auth`

  // @ts-expect-error - build output only exists after `react-router build`
  const build = await import("./build/server/index.js")
  const { createRequestHandler } = await import("react-router")
  const handler = createRequestHandler(build, "production")
  const clientDir = path.resolve(import.meta.dir, "build/client")

  Bun.serve({
    fetch: async (request, server) => {
      if (request.url.includes("/ws")) {
        const result = await DSWS.tryUpgrade(request, server)
        if (result === "upgraded") return
        if (result instanceof Response) return result
      }

      const staticResponse = await serveStatic(clientDir, request)
      if (staticResponse) return staticResponse

      return handler(request)
    },
    port: HTTP_PORT,
    websocket: DSWS.websocket,
  })

  BaseLogger.info(`DockStat frontend + API listening on http://localhost:${HTTP_PORT}`)
}

main().catch((error) => {
  BaseLogger.error("Failed to start server:", error)
  process.exit(1)
})
