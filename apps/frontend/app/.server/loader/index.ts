/**
 * Server-side data loaders, exposed with React Router loader signatures so
 * route modules can delegate directly:
 *
 *   import { Loaders } from "~/.server/loader"
 *   export const loader = Loaders.Widgets.listDashboards
 *
 * Every member receives `{ request, params }` and returns loader-ready data.
 */
import { heapStats, memoryUsage } from "bun:jsc"
import os from "node:os"
import { BASE_URL, oidc as client, FRONTEND_URL, verifyAuthToken } from "@dockstat/auth"
import { createThemeHandler, type themeType } from "@dockstat/theme-handler/server"
import type { DOCKER } from "@dockstat/typings"
import { formatBytes } from "@dockstat/utils"
import { NODE_TEMPLATES } from "@dockstat/widgets/server"
import { configCache, dockerCache, repoCache, statusCache } from "../cache"
import { calculateNodeLayout, type DockNodeArray } from "../graph"
import { mapReachableStatus } from "../graph/reachableStatus"
import { fail, ok, query, type RouteArgs, serializeDates } from "../lib/http"
import { BaseLogger } from "../logger"
import { formatPrometheusMetrics } from "../metrics/recorder"
import Singletons from "../singletons"
import { Certificates } from "../singletons/certificates"
import { DockStatDB } from "../singletons/db"

const themeHandler = createThemeHandler({ db: DockStatDB._sqliteWrapper, logger: BaseLogger })
const themeDB = themeHandler.getThemeDB()

const themeResponse = (theme: themeType, message: string) =>
  ok({ data: theme, message, success: true })

// ── OAuth helpers ───────────────────────────────────────────────────

const isSecure = () => BASE_URL.startsWith("https://")

const cookie = (name: string, value: string, maxAge: number) =>
  `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly;${isSecure() ? " Secure;" : ""} SameSite=Lax; Max-Age=${maxAge}`

const readCookie = (request: Request, name: string): string | null => {
  const match = (request.headers.get("Cookie") ?? "").match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

const clearCookies = (...names: string[]) =>
  names.map((name) => `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)

/** 302 redirect that can carry Set-Cookie headers */
const redirectTo = (location: string, headers = new Headers()) => {
  headers.set("Location", location)
  return new Response(null, { headers, status: 302 })
}

// ── Misc helpers ────────────────────────────────────────────────────

let lastCpu = process.cpuUsage()
let lastTime = Bun.nanoseconds()

function systemStats() {
  const mem = memoryUsage()
  const heap = heapStats()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()

  const now = Bun.nanoseconds()
  const cpuNow = process.cpuUsage()
  const deltaCpuUs = cpuNow.user - lastCpu.user + (cpuNow.system - lastCpu.system)
  const deltaWallUs = (now - lastTime) / 1000
  const cpuPercent = deltaWallUs > 0 ? (deltaCpuUs / deltaWallUs) * 100 : 0

  lastCpu = cpuNow
  lastTime = now

  const cpus = os.cpus()

  return {
    process: {
      cpu: {
        percentSinceLastCall: Number(cpuPercent.toFixed(2)),
        systemMs: cpuNow.system / 1000,
        userMs: cpuNow.user / 1000,
      },
      memory: {
        external: formatBytes(heap.globalObjectCount),
        heapTotal: formatBytes(heap.heapCapacity),
        heapUsed: formatBytes(heap.heapSize),
        rss: formatBytes(mem.current),
      },
      memoryLimit: formatBytes(process.constrainedMemory() || 0),
      uptimeSec: process.uptime(),
    },
    system: {
      cpu: { cores: cpus.length, loadavg: os.loadavg(), model: cpus[0]?.model },
      memory: {
        free: formatBytes(freeMem),
        total: formatBytes(totalMem),
        used: formatBytes(totalMem - freeMem),
      },
      uptimeSec: os.uptime(),
    },
  }
}

export const Loaders = {
  Auth: {
    getApiKeys: ({ request }: RouteArgs) => {
      const userId = query(request).get("userId") ?? undefined
      const keys = userId
        ? Singletons.Auth.Handler.apiKeys
            .select(["id", "name", "scopes", "expiresAt", "lastUsedAt", "createdAt", "revokedAt"])
            .where({ userId })
            .all()
        : Singletons.Auth.Handler.apiKeys
            .select(["id", "name", "scopes", "expiresAt", "lastUsedAt", "createdAt", "revokedAt"])
            .all()
      return {
        keys: keys.map((k) =>
          serializeDates(k as unknown as Record<string, unknown>, [
            "createdAt",
            "expiresAt",
            "lastUsedAt",
            "revokedAt",
          ])
        ),
      }
    },
    getAuthLocalUsers: () => ({
      users: Singletons.Auth.Handler.users
        .select(["id", "name", "createdAt", "updatedAt"])
        .all()
        .map((u) =>
          serializeDates(u as unknown as Record<string, unknown>, ["createdAt", "updatedAt"])
        ),
    }),
    getAuthProviders: () =>
      Singletons.Auth.Handler.providers
        .select(["id", "issuer_url", "scopes", "client_id", "created_at", "name", "icon"])
        .all(),
    isGuestRegAllowed: () => Singletons.Auth.Handler.getAllowGuestRegistration(),

    /** GET — redirect to the frontend login page */
    localLoginPage: () => redirectTo(`${FRONTEND_URL}/auth/local/login`),

    /** GET — local logout: revoke session, clear cookie, redirect */
    async localLogout({ request }: RouteArgs) {
      const token = readCookie(request, "auth_token")

      const headers = new Headers()
      if (token) {
        const payload = await verifyAuthToken(token)
        if (payload?.jti) {
          Singletons.Auth.Handler.sessions.where({ jti: payload.jti }).delete()
        }
        headers.append("Set-Cookie", "auth_token=; Path=/; SameSite=Lax; Max-Age=0")
      }

      const redirectUri = new URL(request.url).searchParams.get("redirectUri") || FRONTEND_URL
      return redirectTo(redirectUri, headers)
    },
    localUsersExist: () => ({
      exists: !!Singletons.Auth.Handler.users.select(["id"]).first(),
    }),

    /** GET — finish the OIDC flow (validates state, exchanges code, sets auth_token) */
    async oAuthCallback({ params, request }: RouteArgs<{ providerId: string }>) {
      const { meta } = await Singletons.Auth.Handler.configService.getConfig(
        params.providerId as string
      )
      const url = new URL(request.url)

      const state = readCookie(request, "state")
      const nonce = readCookie(request, "nonce")
      const pkce = readCookie(request, "pkce")

      if (!state || !nonce || !pkce) {
        return new Response(
          "Authentication failed: Missing security cookies. Please try logging in again from the login page.",
          { status: 400 }
        )
      }
      if (state !== url.searchParams.get("state")) {
        return new Response("Invalid state", { status: 400 })
      }

      try {
        const tokens = await client.authorizationCodeGrant(meta, url, {
          expectedNonce: nonce,
          expectedState: state,
          pkceCodeVerifier: pkce,
        })
        if (!tokens) throw new Error("No tokens returned from provider")

        const userInfo = await client.fetchUserInfo(
          meta,
          tokens.access_token ?? "",
          String((tokens.claims?.() ?? { sub: "" }).sub)
        )

        const { createAuthToken } = await import("@dockstat/auth")
        const { jti, token } = await createAuthToken(userInfo)
        Singletons.Auth.Handler.sessions.insert({
          expiresAt: new Date(Date.now() + 86400 * 1000),
          jti,
          userId: String(userInfo.sub),
        })

        const headers = new Headers()
        for (const c of clearCookies("state", "nonce", "pkce")) headers.append("Set-Cookie", c)
        headers.append(
          "Set-Cookie",
          `auth_token=${encodeURIComponent(token)}; Path=/;${isSecure() ? " Secure;" : ""} SameSite=Lax; Max-Age=86400`
        )

        return redirectTo(`${FRONTEND_URL}/auth/${params.providerId}/callback`, headers)
      } catch (error) {
        return new Response(
          `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          { status: 500 }
        )
      }
    },

    /** GET — start the OIDC flow for a provider (sets state/nonce/pkce cookies, redirects) */
    async oAuthLogin({ params }: RouteArgs<{ providerId: string }>) {
      const { meta, scopes } = await Singletons.Auth.Handler.configService.getConfig(
        params.providerId as string
      )

      const stateVal = client.randomState()
      const nonceVal = client.randomNonce()
      const code_verifier = client.randomPKCECodeVerifier()
      const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)

      const authUrl: URL = client.buildAuthorizationUrl(meta, {
        code_challenge,
        code_challenge_method: "S256",
        nonce: nonceVal,
        redirect_uri: `${BASE_URL}/${params.providerId}/callback`,
        scopes,
        state: stateVal,
      })

      const headers = new Headers()
      headers.append("Set-Cookie", cookie("state", stateVal, 600))
      headers.append("Set-Cookie", cookie("nonce", nonceVal, 600))
      headers.append("Set-Cookie", cookie("pkce", code_verifier, 600))

      return redirectTo(authUrl.toString(), headers)
    },

    /** GET — revoke the session and redirect to the provider's end-session URL */
    async oAuthLogout({ params, request }: RouteArgs<{ providerId: string }>) {
      const token = readCookie(request, "auth_token")

      const headers = new Headers()
      if (token) {
        const payload = await verifyAuthToken(token)
        if (payload?.jti) {
          Singletons.Auth.Handler.sessions.where({ jti: payload.jti }).delete()
        }
        headers.append("Set-Cookie", "auth_token=; Path=/; SameSite=Lax; Max-Age=0")
      }

      const { meta } = await Singletons.Auth.Handler.configService.getConfig(
        params.providerId as string
      )
      const { logout_url: logoutUrl } = Singletons.Auth.Handler.providers
        .select(["logout_url"])
        .where({ id: params.providerId })
        .first() ?? { logout_url: null }

      const redirectUri = new URL(request.url).searchParams.get("redirectUri") ?? ""
      let endUrl = client.buildEndSessionUrl(meta, {
        post_logout_redirect_uri: redirectUri,
      })
      if (logoutUrl !== null) endUrl = new URL(logoutUrl)

      return redirectTo(endUrl.toString(), headers)
    },

    /** GET — verify a token (Authorization header or auth_token cookie) */
    async verifyToken({ request }: RouteArgs) {
      const authHeader = request.headers.get("Authorization")
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : readCookie(request, "auth_token")

      if (!token) return Response.json({ error: "No token provided" }, { status: 401 })

      const payload = await verifyAuthToken(token)
      if (!payload || typeof payload.user !== "object" || payload.user === null) {
        return Response.json({ error: "Invalid or expired token" }, { status: 401 })
      }
      if (payload.jti && !Singletons.Auth.Handler.sessions.where({ jti: payload.jti }).exists()) {
        return Response.json({ error: "Session revoked" }, { status: 401 })
      }

      return { user: payload.user }
    },
  },

  Certificates: {
    get: ({ params }: RouteArgs<{ id: string }>) => {
      const row = Singletons.DB.certificatesTable.select(["*"]).where({ id: params.id }).get()
      if (!row) return fail(404, `Certificate with id ${params.id} not found`)
      return { data: Certificates.sanitize(row), message: "Certificate found", success: true }
    },
    list: ({ request }: RouteArgs) => {
      const type = query(request).get("type")
      const rows = Singletons.DB.certificatesTable.select(["*"]).all()
      const filtered = type ? rows.filter((r) => r.type === type) : rows
      return {
        data: filtered.map((r) => Certificates.sanitize(r)),
        message: `Found ${filtered.length} certificates`,
        success: true,
      }
    },
  },

  DB: {
    getConfig: () =>
      configCache.getOrCompute("config", () => Singletons.DB.configTable.select(["*"]).all()[0]),
    getDetails: () => {
      const schema = Singletons.DB._sqliteWrapper.getSchema()
      const info: Record<string, unknown> = {}
      for (const table of schema) {
        info[table.name] = {
          info: Singletons.DB._sqliteWrapper.getTableInfo(table.name),
          table,
        }
      }
      return {
        backups: Singletons.DB._sqliteWrapper.listBackups(),
        info,
        integrity: Singletons.DB._sqliteWrapper.integrityCheck(),
        path: Singletons.DB._dbPath,
      }
    },
    getRepository: ({ params }: RouteArgs<{ id: string }>) => {
      const id = Number(params.id)
      const found = Singletons.DB.repositoriesTable.select(["*"]).where({ id }).get()
      if (!found) {
        return fail(404, `Repository with id ${params.id} not found`)
      }
      return { data: found, message: "Repository found", success: true }
    },
    getTableRows: ({ params }: RouteArgs<{ tableName: string }>) =>
      Singletons.DB._sqliteWrapper
        .table(params.tableName as string)
        .select(["*"])
        .all(),
    listRepositories: () => ({
      data: Singletons.DB.repositoriesTable.select(["*"]).all(),
      message: `Found ${Singletons.DB.repositoriesTable.select(["*"]).all().length} repositories`,
      success: true,
    }),
  },

  Docker: {
    getAllClients: ({ params }: RouteArgs<{ stored?: string }>) =>
      Singletons.Docker.getAllClients(params.stored === "true"),
    getAllContainerStats: () =>
      dockerCache.getOrComputeAsync("all-containers", () =>
        Singletons.Docker.getAllContainerStats()
      ),
    getAllHosts: () => Singletons.Docker.getAllHosts(),
    getCachedContainers: ({ params }: RouteArgs<{ clientId: string }>) =>
      dockerCache.getOrComputeAsync(`client-${params.clientId}-containers`, () =>
        Singletons.Docker.getAllContainers(Number(params.clientId))
      ),
    getContainers: ({ params }: RouteArgs<{ clientId: string }>) =>
      Singletons.Docker.getAllContainers(Number(params.clientId)),
    getHostMetrics: ({ params }: RouteArgs<{ clientId: string }>) =>
      Singletons.Docker.getAllHostMetrics(Number(params.clientId)),
    /** Ping all clients or one via `params.clientId` */
    async getPing({ params }: RouteArgs<{ clientId?: string }>) {
      const clientId = params.clientId ? Number(params.clientId) : undefined
      const clients = clientId
        ? Singletons.Docker.getAllClients().filter((c) => c.id === clientId)
        : Singletons.Docker.getAllClients()
      const hosts = await Singletons.Docker.getAllHosts()
      const hostsMap = new Map(hosts.map((h) => [h.id, h]))

      const pingRes = await Promise.all(
        clients.map(async (c) => {
          const ping = await Singletons.Docker.ping(c.id)
          return {
            clientId: c.id,
            clientName: c.name,
            reachable: ping.reachableInstances.map((id) => hostsMap.get(id)).filter(Boolean),
            unreachable: ping.unreachableInstances.map((id) => hostsMap.get(id)).filter(Boolean),
          }
        })
      )
      return clientId ? pingRes[0] : pingRes
    },
    getPoolMetrics: () => Singletons.Docker.getPoolMetrics(),
    getStatus: () => Singletons.Docker.getStatus(),
  },

  Graph: {
    async getGraphData() {
      const DCM = Singletons.Docker
      const clients = DCM.getAllClients()
      const hosts = await DCM.getAllHosts()

      const containersNested = await Promise.all(clients.map((c) => DCM.getAllContainers(c.id)))
      const containers: DOCKER.ContainerInfo[] = containersNested.flat()

      const rawDockNodes = await Singletons.DockNodes.getAllNodes()

      const dockNodes: DockNodeArray = rawDockNodes
        .map((node) => {
          if (node.id === undefined) return null
          return {
            hostname: node.host ?? undefined,
            id: node.id,
            name: node.name ?? undefined,
            port: node.port ?? undefined,
            reachable: mapReachableStatus(node),
          }
        })
        .filter((node): node is NonNullable<typeof node> => node !== null)

      const { nodes, edges } = calculateNodeLayout({ clients, containers, dockNodes, hosts })

      return {
        clients: clients.map((c) => ({
          id: c.id,
          initialized: c.initialized ?? false,
          name: c.name,
        })),
        containers,
        dockNodes,
        edges,
        hosts: hosts.map((h) => ({
          clientId: h.clientId,
          id: h.id,
          name: h.name,
          reachable: h.reachable ?? false,
        })),
        nodes,
      }
    },
  },

  Misc: {
    getStats: () => systemStats(),
  },

  Plugins: {
    Frontend: {
      getByPlugin: () => Singletons.Plugins.getFrontendRoutesByPlugin(),
      getNavigation: () => Singletons.Plugins.getFrontendNavigationItems(),
      getRouteActions: ({ params, request }: RouteArgs<{ pluginId: string }>) => {
        const pluginId = Number(params.pluginId)
        const routePath = `/${query(request).get("path") || ""}`
        return {
          actions: Singletons.Plugins.getRouteActions(pluginId, routePath),
          pluginId,
          routePath,
        }
      },
      getRouteLoaders: ({ params, request }: RouteArgs<{ pluginId: string }>) => {
        const pluginId = Number(params.pluginId)
        const routePath = `/${query(request).get("path") || ""}`
        return {
          loaders: Singletons.Plugins.getRouteLoaders(pluginId, routePath),
          pluginId,
          routePath,
        }
      },
      getRoutes: () => Singletons.Plugins.getAllFrontendRoutes(),
      getSummary: () => Singletons.Plugins.getFrontendSummary(),
    },
    getAll: () => Singletons.Plugins.getAll(),
    getHooks: () => {
      const hooksArray: { pluginId: number; hooks: string[] }[] = []
      for (const [pluginId, hooks] of Singletons.Plugins.getHookHandlers().entries()) {
        hooksArray.push({ hooks: Object.keys(hooks), pluginId: Number(pluginId) })
      }
      return hooksArray
    },
    getRoutes: () => Singletons.Plugins.getAllPluginRoutes(),
    getStatus: () => Singletons.Plugins.getStatus(),
  },

  Repositories: {
    getAll: () => Singletons.DB.repositoriesTable.select(["*"]).all(),
    getAllManifests: () =>
      repoCache.getOrComputeAsync(
        "all-manifests",
        async () => {
          const { repo } = await import("@dockstat/utils")
          const allRepos = Singletons.DB.repositoriesTable.select(["*"]).all()

          const results = await Promise.all(
            allRepos.map(async (repoElement) => {
              const link = repo.parseFromDBToRepoLink(repoElement.type, repoElement.source)

              try {
                const response = await fetch(link)
                if (!response.ok) return null

                const text = await response.text()
                const contentType = response.headers.get("content-type") || ""

                let data: unknown
                if (contentType.includes("application/json") || link.endsWith(".json")) {
                  data = JSON.parse(text)
                } else if (
                  contentType.includes("yaml") ||
                  contentType.includes("yml") ||
                  link.endsWith(".yaml") ||
                  link.endsWith(".yml")
                ) {
                  data = Bun.YAML.parse(text)
                } else {
                  try {
                    data = Bun.YAML.parse(text)
                  } catch {
                    data = JSON.parse(text)
                  }
                }

                return {
                  key: repoElement.name,
                  value: { data, repoSource: repoElement.source, type: repoElement.type },
                }
              } catch {
                return null
              }
            })
          )

          const result: Record<string, { data: unknown; repoSource: string; type: string }> = {}
          for (const item of results) if (item) result[item.key] = item.value
          return result
        },
        5 * 60_000
      ),
  },

  Status: {
    getSystemStatus: () =>
      statusCache.getOrComputeAsync("system-status", async () => {
        const services = [
          {
            details: { hasConfigTable: !!Singletons.DB.configTable, path: Singletons.DB._dbPath },
            initialized: !!Singletons.DB._sqliteWrapper,
            name: "Database",
          },
          { details: { available: true }, initialized: true, name: "Logger" },
          {
            details: {
              ...Singletons.Plugins.getStatus(),
              registeredHooks: Array.from(Singletons.Plugins.getHookHandlers()).length,
              registeredRoutes: Singletons.Plugins.getAllPluginRoutes().length,
              totalPlugins: Singletons.Plugins.getAll().length,
            },
            initialized: true,
            name: "PluginHandler",
          },
          {
            details: await Singletons.Docker.getStatus(),
            initialized: true,
            name: "DockerClientManager",
          },
        ]

        return {
          services,
          status: services.every((s) => s.initialized) ? "healthy" : "degraded",
          timestamp: new Date().toISOString(),
        }
      }),
  },

  System: {
    /** GET — Prometheus exposition of the request metrics */
    prometheus() {
      const db = (
        Singletons.DB._sqliteWrapper as unknown as {
          getDb: () => import("bun:sqlite").Database
        }
      ).getDb()
      return new Response(formatPrometheusMetrics(db), {
        headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" },
      })
    },
  },

  Themes: {
    byId: ({ params }: RouteArgs<{ id: string }>) => {
      const id = Number(params.id)
      if (Number.isNaN(id)) return fail(400, "Invalid theme ID")
      const theme = themeDB.getTheme(undefined, id)
      if (!theme) return fail(404, `Theme with id ${id} not found`)
      return themeResponse(theme, `Found theme with id ${id}`)
    },
    byName: ({ params }: RouteArgs<{ name: string }>) => {
      const theme = themeDB.getTheme(params.name)
      if (!theme) return fail(404, `Theme with name "${params.name}" not found`)
      return themeResponse(theme, `Found theme "${params.name}"`)
    },
    list: () => {
      const themes = themeDB.getAllThemes()
      return { data: themes, message: `Found ${themes.length} theme(s)`, success: true }
    },
    defaultTheme: () => themeDB.getAllThemes()[0]
  },

  Widgets: {
    getDashboard: ({ params }: RouteArgs<{ id: string }>) => {
      const dashboard = Singletons.Widgets.dashboards.getById(params.id as string)
      if (!dashboard) return fail(404, `Dashboard "${params.id}" not found`)
      return dashboard
    },
    getDataPipeProviders: () => ({ providers: [] as string[], transformers: [] as string[] }),
    getDataPipeTemplates: () =>
      NODE_TEMPLATES({ getWsTopics: () => Singletons.WS.availableTopics() }),
    getDefaultDashboard: () =>
      Singletons.Widgets.dashboards.getDefault() ?? fail(404, "No default dashboard set"),
    getWidget: ({ params }: RouteArgs<{ id: string }>) => {
      const widget = Singletons.Widgets.widgets.getById(params.id as string)
      if (!widget) return fail(404, `Widget "${params.id}" not found`)
      return widget
    },
    listDashboards: () => Singletons.Widgets.dashboards.list(),
    listWidgets: () => Singletons.Widgets.widgets.list(),
    searchWidgets: ({ params }: RouteArgs<{ query: string }>) =>
      Singletons.Widgets.widgets.search(params.query as string),
  },
} as const

export type Loaders = typeof Loaders
export default Loaders
