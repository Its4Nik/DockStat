/**
 * Server-side mutations, exposed with React Router action signatures so
 * route modules can delegate directly:
 *
 *   import { Actions } from "~/.server/action"
 *   export const action = Actions.Widgets.createDashboard
 *
 * Every member receives `{ request, params }` and returns action-ready data.
 */
import { crypt } from "@dockstat/auth"
import type { RepoFile } from "@dockstat/repo-cli/types"
import { createThemeHandler } from "@dockstat/theme-handler/server"
import type { DB_target_host } from "@dockstat/typings"
import { repo } from "@dockstat/utils"
import { configCache, repoCache } from "../cache"
import { authenticate } from "../lib/authenticate"
import { fail, ok, parseBody, type RouteArgs } from "../lib/http"
import { BaseLogger } from "../logger"
import type { CertificateService } from "../services/certificates"
import Singletons from "../singletons"
import { Certificates, insertCertificate } from "../singletons/certificates"
import { DockStatDB } from "../singletons/db"
import { createAuthToken, verifyAuthToken } from "@dockstat/auth"

const themeHandler = createThemeHandler({ db: DockStatDB._sqliteWrapper, logger: BaseLogger })
const themeDB = themeHandler.getThemeDB()

export const Actions = {
  Auth: {
    /** POST — generate a new API key for a user (the key is only returned once) */
    async createApiKey({ request }: RouteArgs) {
      const body = await parseBody<{
        userId: string
        name: string
        scopes?: string
        expiresAt?: string
      }>(request)

      const apiKey = `dockstat_${crypto.randomUUID().replace(/-/g, "")}`
      const keyHash = await Bun.password.hash(apiKey, {
        algorithm: "argon2id",
        memoryCost: 65536,
        timeCost: 3,
      })

      const apiKeyRecord = Singletons.Auth.Handler.apiKeys.insertAndGet({
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        keyHash,
        lastUsedAt: null,
        name: body.name,
        revokedAt: null,
        scopes: body.scopes || "*",
        userId: body.userId,
      })
      if (!apiKeyRecord) return fail(500, "Failed to create API key")

      return ok(
        {
          apiKey: {
            expiresAt: apiKeyRecord.expiresAt,
            id: apiKeyRecord.id,
            key: apiKey,
            name: apiKeyRecord.name,
            scopes: apiKeyRecord.scopes,
          },
          success: true as const,
        },
        201
      )
    },

    /** POST — create an OAuth/OIDC provider */
    async createProvider({ request }: RouteArgs) {
      const body = await parseBody<{
        client_id: string
        client_secret: string
        icon?: string
        issuer_url: string
        logout_url?: string | null
        name?: string
        scopes?: string | null
      }>(request)

      return ok(
        await Singletons.Auth.Handler.providers.insertAndGet({
          client_id: body.client_id,
          client_secret: await crypt.encrypt(body.client_secret),
          icon: body.icon || undefined,
          issuer_url: body.issuer_url,
          logout_url: body.logout_url || undefined,
          name: body.name || undefined,
          scopes: body.scopes || undefined,
        }),
        201
      )
    },

    /** DELETE — remove an OAuth/OIDC provider */
    async deleteProvider({ params }: RouteArgs<{ providerId: string }>) {
      const existing = Singletons.Auth.Handler.providers.where({ id: params.providerId }).first()
      if (!existing) return fail(404, "Provider not found")
      Singletons.Auth.Handler.providers.where({ id: params.providerId }).delete()
      return { message: "Provider deleted", success: true as const }
    },

    /** DELETE — remove a local user */
    async deleteUser({ params }: RouteArgs<{ userId: string }>) {
      const users = Singletons.Auth.Handler.users
      const existing = users.where({ id: params.userId }).first()
      if (!existing) return fail(404, "User not found")
      users.where({ id: params.userId }).delete()
      return { message: "User deleted", success: true as const }
    },
    /** POST — local username/password login, returns a JWT.
     * With withValidation the credentials arrive pre-validated via `data`;
     * standalone JSON API usage falls back to parsing the request body. */
    async localLogin({ request }: RouteArgs, data?: { name: string; pass: string }) {
      const body = data ?? (await parseBody<{ name: string; pass: string }>(request))
      const user = Singletons.Auth.Handler.users
        .select(["id", "name", "passHash"])
        .where({ name: body.name })
        .first()

      if (!user) return fail(401, "Invalid credentials")
      if (!(await Bun.password.verify(body.pass, user.passHash))) {
        return fail(401, "Invalid credentials")
      }


      const { jti, token } = await createAuthToken({
        email: user.name,
        name: user.name,
        provider: "local",
        sub: user.id,
      })

      Singletons.Auth.Handler.sessions.insert({
        expiresAt: new Date(Date.now() + 86400 * 1000),
        jti,
        userId: user.id,
      })

      return { success: true as const, token, message: "Authnenticated successfully" }
    },

    /** POST — register a local user (guests only while guest registration is allowed).
     * With withValidation the credentials arrive pre-validated via `data`;
     * standalone JSON API usage falls back to parsing the request body. */
    async register({ request }: RouteArgs, data?: { name: string; pass: string }) {
      const body = data ?? (await parseBody<{ name: string; pass: string }>(request))
      const user = await authenticate(request)

      const users = Singletons.Auth.Handler.users
      const isInitialUser = users.select(["id"]).count() === 0
      const allowGuests = Singletons.Auth.Handler.getAllowGuestRegistration()
      const existingUser = users.select(["id"]).where({ name: body.name }).first()

      if (existingUser) return fail(409, "Username already exists")
      if (!allowGuests && !user) {
        return fail(403, "Guest registration is disabled. Please authenticate to create new users.")
      }

      const passHash = await Bun.password.hash(body.pass, {
        algorithm: "argon2id",
        memoryCost: 65536,
        timeCost: 4,
      })
      const created = users.insertAndGet({ name: body.name, passHash })
      if (!created) return fail(500, "Failed to create user")

      let msg: string | undefined
      if (isInitialUser) {
        msg =
          "This was the first user that has been created, restricting local registration of users to already registered users. You can change this inside the DockStat settings under additional settings."
        Singletons.Auth.Handler.setAllowGuestRegistration(false)
      }

      return { message: msg || "User created successfully", success: true as const, user: { id: created.id, name: created.name } }
    },

    /** DELETE — revoke an API key */
    async revokeApiKey({ params }: RouteArgs<{ id: string }>) {
      const apiKey = Singletons.Auth.Handler.apiKeys
        .select(["id", "revokedAt"])
        .where({ id: params.id })
        .first()
      if (!apiKey) return fail(404, "API key not found")
      if (apiKey.revokedAt) return fail(400, "API key is already revoked")
      Singletons.Auth.Handler.apiKeys.where({ id: params.id }).update({ revokedAt: new Date() })
      return { message: "API key revoked successfully", success: true as const }
    },

    /** POST — revoke the session identified by Bearer token or auth_token cookie */
    async revokeSession({ request }: RouteArgs) {
      const authHeader = request.headers.get("Authorization")
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

      if (!token) return fail(400, "No token provided")

      const payload = await verifyAuthToken(token)
      if (payload?.jti) {
        Singletons.Auth.Handler.sessions.where({ jti: payload.jti }).delete()
      }

      const headers = new Headers({ "Set-Cookie": "auth_token=; Path=/; SameSite=Lax; Max-Age=0" })
      return Response.json({ success: true }, { headers })
    },

    /** POST — enable/disable guest registration */
    async toggleGuestRegistration({ params }: RouteArgs<{ allow: string }>) {
      const allow = params.allow
      if (allow !== "enable" && allow !== "disable") {
        return fail(400, "Invalid action. Use 'enable' or 'disable'")
      }
      Singletons.Auth.Handler.setAllowGuestRegistration(allow === "enable")
      return { message: `Guest registration ${allow}d`, success: true as const }
    },
  },

  Certificates: {
    /** POST — register an external certificate reference */
    async external({ request }: RouteArgs) {
      const body = await parseBody<Parameters<CertificateService["external"]>[0]>(request)
      const prepared = Certificates.external(body)
      const row = insertCertificate(prepared, { comment: body.comment, tags: body.tags })
      if (!row) return fail(500, "Failed to persist external certificate reference")
      return {
        data: Certificates.sanitize(row),
        message: `Registered external ${prepared.type} certificate`,
        success: true as const,
      }
    },
    /** POST — generate a new certificate */
    async generate({ request }: RouteArgs) {
      const body = await parseBody<Parameters<CertificateService["generate"]>[0]>(request)
      const prepared = Certificates.generate(body)
      const row = insertCertificate(prepared, { comment: body.comment, tags: body.tags })
      if (!row) return fail(500, "Failed to persist generated certificate")
      return {
        data: Certificates.sanitize(row),
        message: `Generated ${prepared.type} certificate`,
        success: true as const,
      }
    },

    /** POST — import existing certificate material */
    async import({ request }: RouteArgs) {
      const body = await parseBody<Parameters<CertificateService["import"]>[0]>(request)
      const prepared = Certificates.import(body)
      const row = insertCertificate(prepared, {
        comment: body.comment,
        expiresAt: body.expiresAt,
        tags: body.tags,
      })
      if (!row) return fail(500, "Failed to persist imported certificate")
      return {
        data: Certificates.sanitize(row),
        message: `Imported ${prepared.type} certificate`,
        success: true as const,
      }
    },

    /** DELETE — remove a certificate */
    async remove({ params }: RouteArgs<{ id: string }>) {
      const existing = Singletons.DB.certificatesTable.select(["*"]).where({ id: params.id }).get()
      if (!existing) return fail(404, `Certificate with id ${params.id} not found`)
      Singletons.DB.certificatesTable.where({ id: params.id }).delete()
      return { message: `Certificate "${existing.title}" deleted`, success: true as const }
    },

    /** POST — resolve credential material by type */
    async resolve({ request }: RouteArgs) {
      const body = await parseBody<Parameters<CertificateService["resolve"]>[1]>(request)
      const rows = Singletons.DB.certificatesTable.select(["*"]).all()
      const resolved = Certificates.resolve(rows, body)

      const privateData = resolved.privateData ? Certificates.reveal(resolved) : ""
      return {
        data: {
          externalRef: resolved.externalRef,
          fingerprint: resolved.fingerprint,
          id: resolved.id,
          privateData,
          publicData: resolved.publicData,
          title: resolved.title,
          type: resolved.type,
        },
        message: "Certificate resolved",
        success: true as const,
      }
    },

    /** POST — reveal private certificate material */
    async reveal({ params }: RouteArgs<{ id: string }>) {
      const row = Singletons.DB.certificatesTable.select(["*"]).where({ id: params.id }).get()
      if (!row) return fail(404, `Certificate with id ${params.id} not found`)
      return {
        data: Certificates.sanitize(row),
        message: "Private material revealed",
        privateData: Certificates.reveal(row),
        success: true as const,
      }
    },

    /** PUT — update certificate metadata */
    async update({ params, request }: RouteArgs<{ id: string }>) {
      const body = await parseBody<{
        title?: string
        comment?: string
        tags?: string[]
        expiresAt?: string | null
      }>(request)

      const existing = Singletons.DB.certificatesTable.select(["*"]).where({ id: params.id }).get()
      if (!existing) return fail(404, `Certificate with id ${params.id} not found`)

      const update: Record<string, unknown> = { updatedAt: new Date().toISOString() }
      if (body.title !== undefined) update.title = body.title
      if (body.comment !== undefined) update.comment = body.comment
      if (body.tags !== undefined) update.tags = body.tags
      if (body.expiresAt !== undefined) update.expiresAt = body.expiresAt

      Singletons.DB.certificatesTable.where({ id: params.id }).update(update)
      const updated = Singletons.DB.certificatesTable.select(["*"]).where({ id: params.id }).get()
      if (!updated) return fail(500, "Failed to retrieve updated certificate")
      return {
        data: Certificates.sanitize(updated),
        message: "Certificate updated",
        success: true as const,
      }
    },
  },

  DB: {
    /** POST — add a repository from a manifest URL */
    async createRepository({ request }: RouteArgs) {
      const body = await parseBody<{ link_to_manifest: string }>(request)
      const repoFile = (await (await fetch(body.link_to_manifest)).json()) as RepoFile

      const existing = Singletons.DB.repositoriesTable
        .select(["*"])
        .where({ name: repoFile.config.name })
        .get()
      if (existing) {
        return fail(409, `Repository "${repoFile.config.name}" already exists`)
      }

      Singletons.DB.repositoriesTable.insert({
        name: repoFile.config.name,
        paths: {
          plugins: repoFile.config.plugins,
          stacks: repoFile.config.stacks,
          themes: repoFile.config.themes,
        },
        policy: repoFile.config.policy,
        source: repo.parseRawToDB(body.link_to_manifest).source,
        type: repoFile.config.type,
        verification_api: repoFile.config.verification_api,
      })

      const newRepo = Singletons.DB.repositoriesTable
        .select(["*"])
        .where({ name: repoFile.config.name })
        .get()
      if (!newRepo) return fail(500, "Failed to retrieve created repository")

      repoCache.invalidate()
      return ok(
        {
          data: newRepo,
          message: `Repository "${repoFile.config.name}" created successfully`,
          success: true as const,
        },
        201
      )
    },

    /** DELETE — remove a repository */
    async deleteRepository({ params }: RouteArgs<{ id: string }>) {
      const id = Number(params.id)
      const repos = Singletons.DB.repositoriesTable
      const existing = repos.select(["*"]).where({ id }).get()
      if (!existing) return fail(404, `Repository with id ${id} not found`)
      repos.where({ id }).delete()
      repoCache.invalidate()
      return {
        message: `Repository "${existing.name}" deleted successfully`,
        success: true as const,
      }
    },

    /** POST — pin a navigation item */
    async pinItem({ request }: RouteArgs) {
      const body = await parseBody<{ path: string; slug: string }>(request)
      const { nav_links, id } = Singletons.DB.configTable.select(["nav_links", "id"]).all()[0]
      const res = Singletons.DB.configTable
        .where({ id })
        .update({ nav_links: [...nav_links, { path: body.path, slug: body.slug }] })
      configCache.invalidate()
      return res
    },

    /** POST — set the default dashboard */
    async setDefaultDashboard({ request }: RouteArgs) {
      const body = await parseBody<{ dashboardId: string | null }>(request)
      const currentConfig = Singletons.DB.configTable.select(["additionalSettings", "id"]).all()[0]
      const newAdditionalSettings = {
        defaultDashboard: body.dashboardId ?? undefined,
        showBackendRamUsageInNavbar: currentConfig.additionalSettings?.showBackendRamUsageInNavbar,
      }
      Singletons.DB.configTable
        .where({ id: 0 })
        .update({ additionalSettings: newAdditionalSettings })
      configCache.invalidate()
      return {
        data: newAdditionalSettings,
        message: "Default dashboard updated successfully",
        success: true as const,
      }
    },

    /** POST — unpin a navigation item */
    async unpinItem({ request }: RouteArgs) {
      const body = await parseBody<{ path: string; slug: string }>(request)
      const { nav_links, id } = Singletons.DB.configTable.select(["nav_links", "id"]).all()[0]
      const res = Singletons.DB.configTable.where({ id }).update({
        nav_links: nav_links.filter((link) => link.path !== body.path || link.slug !== body.slug),
      })
      configCache.invalidate()
      return res
    },

    /** POST — update additional settings */
    async updateAdditionalSettings({ request }: RouteArgs) {
      const body = await parseBody<{ additionalSettings: Record<string, unknown> }>(request)
      const prev = Singletons.DB.configTable
        .select(["additionalSettings"])
        .where({ id: 0 })
        .get()?.additionalSettings

      Singletons.DB.configTable
        .where({ id: 0 })
        .update({ additionalSettings: body.additionalSettings })

      if (
        prev?.enableRegistration !== body.additionalSettings?.enableRegistration &&
        body.additionalSettings?.enableRegistration !== undefined
      ) {
        Singletons.Auth.Handler.setAllowGuestRegistration(
          !!body.additionalSettings.enableRegistration
        )
      }

      configCache.invalidate()
      return {
        data: body.additionalSettings,
        message: "Additional settings updated successfully",
        success: true as const,
      }
    },
    /** POST — update the config */
    async updateConfig({ request }: RouteArgs) {
      const body = await parseBody<Record<string, unknown>>(request)
      const updateRes = Singletons.DB.configTable.where({ id: 0 }).update(body)
      configCache.invalidate()
      return {
        code: 200,
        message: "Updated config successfully",
        new_config: Singletons.DB.configTable.select(["*"]).where({ id: 0 }).get(),
        update_response: updateRes,
      }
    },

    /** POST — update hotkeys */
    async updateHotkeys({ request }: RouteArgs) {
      const body = await parseBody<{ hotkeys: Record<string, string> }>(request)
      const res = Singletons.DB.configTable.where({ id: 0 }).update({ hotkeys: body.hotkeys })
      configCache.invalidate()
      return res
    },

    /** PUT — update a repository */
    async updateRepository({ params, request }: RouteArgs<{ id: string }>) {
      const id = Number(params.id)
      const body = await parseBody<Record<string, unknown>>(request)
      const repos = Singletons.DB.repositoriesTable

      const existing = repos.select(["*"]).where({ id }).get()
      if (!existing) return fail(404, `Repository with id ${id} not found`)

      if (body.name && body.name !== existing.name) {
        const nameConflict = repos
          .select(["*"])
          .where({ name: body.name as string })
          .get()
        if (nameConflict) return fail(409, `Repository "${body.name}" already exists`)
      }

      const { id: _id, ...updateData } = body
      repos.where({ id }).update(updateData)

      const updatedRepo = repos.select(["*"]).where({ id }).get()
      if (!updatedRepo) return fail(500, "Failed to retrieve updated repository")

      repoCache.invalidate()
      return {
        data: updatedRepo,
        message: `Repository "${updatedRepo.name}" updated successfully`,
        success: true as const,
      }
    },
  },

  Docker: {
    /** POST — add a host to a client */
    async addHost({ request }: RouteArgs) {
      const body = await parseBody<{
        clientId: number
        hostname: string
        name: string
        port?: number
        secure?: boolean
      }>(request)

      const host = await Singletons.Docker.addHost(
        body.clientId,
        body.hostname,
        body.name,
        body.secure ?? false,
        body.port ?? 0
      )
      return {
        data: { ...host, id: Number(host.id) },
        message: `Host "${body.name}" added successfully`,
        success: true as const,
      }
    },

    /** POST — create a monitoring manager for a client */
    async createMonitoringManager({ params }: RouteArgs<{ clientId: string }>) {
      await Singletons.Docker.createMonitoringManager(Number(params.clientId))
      return { message: "Monitoring manager created", success: true as const }
    },

    /** POST — initialize all registered clients */
    async initAllClients() {
      for (const c of Singletons.Docker.getAllClients()) {
        Singletons.Docker.init(c.id)
      }
      return Singletons.Docker.getAllClients(true)
    },
    /** POST — register a Docker client */
    async registerClient({ request }: RouteArgs) {
      const body = await parseBody<{ clientName: string; options?: unknown }>(request)
      const res = (await Singletons.Docker.registerClient(
        body.clientName,
        (body.options as object) || undefined
      )) as { success: boolean; message?: string; clientId?: number }
      if (!res.success) return fail(400, res.message || "Registration failed")
      return {
        clientId: Number(res.clientId),
        message: res.message || "Client registered successfully",
        success: true as const,
      }
    },

    /** DELETE — remove a Docker client */
    async removeClient({ request }: RouteArgs) {
      const body = await parseBody<{ clientId: number }>(request)
      const result = await Singletons.Docker.removeClient(body.clientId)
      return {
        data: result,
        message: `Client ${body.clientId} deleted successfully`,
        success: true as const,
      }
    },

    /** DELETE — remove a host */
    async removeHost({ request }: RouteArgs) {
      const body = await parseBody<{ clientId: number; hostId: number }>(request)
      await Singletons.Docker.removeHost(body.clientId, body.hostId)
      return {
        message: `Host with id "${body.hostId}" on Client "${body.clientId}" deleted successfully`,
        success: true as const,
      }
    },

    /** POST — start monitoring for a client */
    async startMonitoring({ params }: RouteArgs<{ clientId: string }>) {
      await Singletons.Docker.startMonitoring(Number(params.clientId))
      return { message: "Monitoring started", success: true as const }
    },

    /** POST — stop monitoring for a client */
    async stopMonitoring({ params }: RouteArgs<{ clientId: string }>) {
      await Singletons.Docker.stopMonitoring(Number(params.clientId))
      return { message: "Monitoring stopped", success: true as const }
    },

    /** POST — toggle monitoring for a client */
    async toggleMonitoring({ params }: RouteArgs<{ clientId: string }>) {
      const clientId = Number(params.clientId)
      if (await Singletons.Docker.isMonitoring(clientId)) {
        await Singletons.Docker.stopMonitoring(clientId)
        return { isMonitoring: false, message: "Monitoring stopped", success: true as const }
      }
      await Singletons.Docker.startMonitoring(clientId)
      return { isMonitoring: true, message: "Monitoring started", success: true as const }
    },

    /** PATCH — update a Docker client */
    async updateClient({ request }: RouteArgs) {
      const body = await parseBody<{ clientId: number; clientName: string; options?: unknown }>(
        request
      )
      const res = (await Singletons.Docker.updateClient(
        body.clientId,
        body.clientName,
        (body.options as object) || {}
      )) as { success: boolean; message?: string; clientId?: number }
      if (!res.success) return fail(400, res.message || "Update failed")
      return {
        clientId: Number(res.clientId),
        message: res.message || "Client updated successfully",
        success: true as const,
      }
    },

    /** PATCH — update a host */
    async updateHost({ request }: RouteArgs) {
      const body = await parseBody<{
        clientId: number
        host: DB_target_host
      }>(request)

      await Singletons.Docker.updateHost(body.clientId, {
        ...body.host,
        docker_client_id: body.clientId,
      })
      return {
        data: body.host,
        message: `Host "${body.host.name}" updated successfully`,
        success: true as const,
      }
    },
  },

  Plugins: {
    /** POST — delete a plugin */
    async deletePlugin({ request }: RouteArgs) {
      const body = await parseBody<{ pluginId: number }>(request)
      return Singletons.Plugins.deletePlugin(body.pluginId)
    },

    Frontend: {
      /** POST — execute a frontend action by id */
      async executeAction({ params, request }: RouteArgs<{ pluginId: string; actionId: string }>) {
        const pluginId = Number(params.pluginId)
        const body = await parseBody<{
          path?: string
          payload?: unknown
          state?: Record<string, unknown>
        }>(request)
        const routePath = `/${body.path || ""}`

        const result = await Singletons.Plugins.executeAction(
          pluginId,
          routePath,
          params.actionId,
          { payload: body.payload, state: body.state }
        )
        if (!result) return fail(404, "Action not found")
        return { actionId: params.actionId, pluginId, result, routePath }
      },

      /** POST — execute a single loader by id */
      async executeLoader({ params, request }: RouteArgs<{ pluginId: string; loaderId: string }>) {
        const pluginId = Number(params.pluginId)
        const body = await parseBody<{ path?: string; state?: Record<string, unknown> }>(request)
        const routePath = `/${body.path || ""}`

        const result = await Singletons.Plugins.executeLoader(
          pluginId,
          routePath,
          params.loaderId,
          { state: body.state }
        )
        if (!result) return fail(404, "Loader not found")
        return { loaderId: params.loaderId, pluginId, result, routePath }
      },

      /** POST — execute all loaders for a plugin route */
      async executeRouteLoaders({ params, request }: RouteArgs<{ pluginId: string }>) {
        const pluginId = Number(params.pluginId)
        const body = await parseBody<{ path?: string; state?: Record<string, unknown> }>(request)
        const routePath = `/${body.path || ""}`

        const { results, state, data } = await Singletons.Plugins.executeRouteLoaders(
          pluginId,
          routePath,
          { state: body.state }
        )
        return { data, pluginId, results, routePath, state }
      },
      /** POST — get a plugin frontend route's template + initial data */
      async getTemplate({ params, request }: RouteArgs<{ pluginId: string }>) {
        const pluginId = Number(params.pluginId)
        const body = await parseBody<{ path?: string }>(request)
        const routePath = `/${body.path || ""}`

        const route = Singletons.Plugins.getFrontendRoute(pluginId, routePath)
        if (!route) return fail(404, "Route not found")

        const template = Singletons.Plugins.getFrontendTemplate(pluginId, routePath)
        const fragments = Singletons.Plugins.getSharedFragments(pluginId)
        const loaders = Singletons.Plugins.getRouteLoaders(pluginId, routePath)
        const actions = Singletons.Plugins.getRouteActions(pluginId, routePath)
        const {
          results: loaderResults,
          state: loadedState,
          data: loadedData,
        } = await Singletons.Plugins.executeRouteLoaders(pluginId, routePath)

        return {
          actions,
          fragments,
          initialData: { data: loadedData, loaderResults, state: loadedState },
          loaders,
          route,
          template,
        }
      },
    },
    /** POST — install a plugin */
    async install({ request }: RouteArgs) {
      const body = await parseBody(request)
      return Singletons.Plugins.savePlugin(
        body as Parameters<typeof Singletons.Plugins.savePlugin>[0]
      )
    },

    /** POST — load/activate plugins */
    async loadPlugins({ request }: RouteArgs) {
      const body = await parseBody<number[]>(request)
      return Singletons.Plugins.loadPlugins(body)
    },

    /** POST — unload/deactivate plugins */
    async unloadPlugins({ request }: RouteArgs) {
      const body = await parseBody<{ ids: number[] }>(request)
      return Singletons.Plugins.unloadPlugins(body.ids)
    },
  },

  Themes: {
    /** POST — create a theme */
    async create({ request }: RouteArgs) {
      const body = await parseBody<{
        name: string
        animations?: Record<string, Record<string, string | number>>
        variables?: Record<string, string>
      }>(request)

      if (themeDB.getTheme(body.name)) {
        return fail(409, `Theme with name "${body.name}" already exists`)
      }
      themeDB.addTheme(body.name, body.animations ?? {}, body.variables ?? {})

      const created = themeDB.getTheme(body.name)
      if (!created) return fail(500, "Failed to retrieve created theme")
      return ok(
        {
          data: created,
          message: `Theme "${body.name}" created successfully`,
          success: true as const,
        },
        201
      )
    },

    /** DELETE — remove a theme */
    async remove({ params }: RouteArgs<{ id: string }>) {
      const id = Number(params.id)
      if (Number.isNaN(id)) return fail(400, "Invalid theme ID")
      themeDB.deleteTheme(id)
      return { message: `Theme with id ${id} deleted`, success: true as const }
    },

    /** PUT — update a theme */
    async update({ params, request }: RouteArgs<{ id: string }>) {
      const id = Number(params.id)
      if (Number.isNaN(id)) return fail(400, "Invalid theme ID")

      const body = await parseBody<{
        name?: string
        animations?: Record<string, Record<string, string | number>>
        variables?: Record<string, string>
      }>(request)

      const existing = themeDB.getTheme(undefined, id)
      if (!existing) return fail(404, `Theme with id ${id} not found`)

      if (body.name && body.name !== existing.name && themeDB.getTheme(body.name)) {
        return fail(409, `Theme with name "${body.name}" already exists`)
      }

      themeDB.updateTheme(id, {
        animations: body.animations,
        name: body.name,
        variables: body.variables,
      })

      const updated = themeDB.getTheme(undefined, id)
      if (!updated) return fail(500, "Failed to retrieve updated theme")
      return {
        data: updated,
        message: `Theme "${updated.name}" updated successfully`,
        success: true as const,
      }
    },
  },

  Widgets: {
    /** POST — create a dashboard */
    async createDashboard({ request }: RouteArgs) {
      const body = await parseBody(request)
      try {
        return ok(
          Singletons.Widgets.dashboards.create(
            body as Parameters<typeof Singletons.Widgets.dashboards.create>[0]
          ),
          201
        )
      } catch (error) {
        return fail(
          400,
          `Failed to create dashboard: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    },
    /** POST — create a widget definition */
    async createWidget({ request }: RouteArgs) {
      const body = await parseBody(request)
      try {
        return ok(
          Singletons.Widgets.widgets.create(
            body as Parameters<typeof Singletons.Widgets.widgets.create>[0]
          ),
          201
        )
      } catch (error) {
        return fail(
          400,
          `Failed to create widget: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    },

    /** DELETE — remove a dashboard */
    async deleteDashboard({ params }: RouteArgs<{ id: string }>) {
      const deleted = Singletons.Widgets.dashboards.delete(params.id)
      if (!deleted) return fail(404, `Dashboard "${params.id}" not found`)
      return { message: `Dashboard "${params.id}" deleted`, success: true as const }
    },

    /** DELETE — remove a widget definition */
    async deleteWidget({ params }: RouteArgs<{ id: string }>) {
      const deleted = Singletons.Widgets.widgets.delete(params.id)
      if (!deleted) return fail(404, `Widget "${params.id}" not found`)
      return { message: `Widget "${params.id}" deleted`, success: true as const }
    },

    /** POST — evaluate a dashboard's data-pipe and push results to subscribers */
    async evaluateDataPipe({ params }: RouteArgs<{ dashboardId: string }>) {
      const dashboard = Singletons.Widgets.dashboards.getById(params.dashboardId)
      if (!dashboard) return fail(404, `Dashboard "${params.dashboardId}" not found`)

      try {
        const payloads = await Singletons.Widgets.engine.evaluate(
          params.dashboardId,
          dashboard.dataPipe
        )
        if (payloads.length > 0) {
          Singletons.Widgets.ws.sendDataUpdate(params.dashboardId, payloads)
        }
        return {
          dashboardId: params.dashboardId,
          payloads,
          success: true as const,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        return fail(
          500,
          `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    },

    /** POST — import a dashboard from JSON */
    async importDashboardJson({ request }: RouteArgs) {
      const body = await parseBody<{ json?: string; archive?: Uint8Array; partial?: boolean }>(
        request
      )
      const json =
        typeof body.json === "string"
          ? body.json
          : new TextDecoder().decode(body.archive ?? new Uint8Array())
      const result = Singletons.Widgets.dashboardImporter.importJson(json, body.partial ?? false)
      return ok(result, result.success ? 200 : 400)
    },

    /** POST — import a dashboard from a zip archive */
    async importDashboardZip({ request }: RouteArgs) {
      const body = await parseBody<{ json?: string; archive?: Uint8Array; partial?: boolean }>(
        request
      )
      const buffer = body.archive ?? new TextEncoder().encode(body.json ?? "")
      const result = await Singletons.Widgets.dashboardImporter.importZip(
        buffer,
        body.partial ?? false
      )
      return ok(result, result.success ? 200 : 400)
    },

    /** POST — import widgets from JSON */
    async importWidgetsJson({ request }: RouteArgs) {
      const body = await parseBody<{ json?: string; archive?: Uint8Array }>(request)
      const json =
        typeof body.json === "string"
          ? body.json
          : new TextDecoder().decode(body.archive ?? new Uint8Array())
      const result = Singletons.Widgets.widgetImporter.importJson(json)
      return ok(result, result.success ? 200 : 400)
    },

    /** POST — import widgets from a zip archive */
    async importWidgetsZip({ request }: RouteArgs) {
      const body = await parseBody<{ json?: string; archive?: Uint8Array }>(request)
      const buffer = body.archive ?? new TextEncoder().encode(body.json ?? "")
      const result = await Singletons.Widgets.widgetImporter.importZip(buffer)
      return ok(result, result.success ? 200 : 400)
    },

    /** POST — set the default dashboard */
    async setDefaultDashboard({ params }: RouteArgs<{ id: string }>) {
      const result = Singletons.Widgets.dashboards.setDefault(params.id)
      const dashboardName = Singletons.Widgets.dashboards.getById(params.id)?.name
      if (!result) return fail(404, `Dashboard "${params.id}" not found`)
      return {
        message: `Dashboard "${dashboardName || params.id}" set as default`,
        success: true as const,
      }
    },

    /** PUT — update a dashboard */
    async updateDashboard({ params, request }: RouteArgs<{ id: string }>) {
      const body = await parseBody(request)
      try {
        return Singletons.Widgets.dashboards.update(
          params.id,
          body as Parameters<typeof Singletons.Widgets.dashboards.update>[1]
        )
      } catch (error) {
        return fail(
          400,
          `Failed to update dashboard: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    },

    /** PUT — update a dashboard's data-pipe graph */
    async updateDataPipe({ params, request }: RouteArgs<{ dashboardId: string }>) {
      const dashboard = Singletons.Widgets.dashboards.getById(params.dashboardId)
      if (!dashboard) return fail(404, `Dashboard "${params.dashboardId}" not found`)

      const body = await parseBody(request)
      try {
        const updated = Singletons.Widgets.dashboards.update(params.dashboardId, {
          dataPipe: body as unknown as Parameters<
            typeof Singletons.Widgets.dashboards.update
          >[1]["dataPipe"],
        })
        return { dashboard: updated, success: true as const }
      } catch (error) {
        return fail(500, error instanceof Error ? error.message : String(error))
      }
    },

    /** PUT — update a widget definition */
    async updateWidget({ params, request }: RouteArgs<{ id: string }>) {
      const body = await parseBody(request)
      try {
        return Singletons.Widgets.widgets.update(
          params.id,
          body as Parameters<typeof Singletons.Widgets.widgets.update>[1]
        )
      } catch (error) {
        return fail(
          400,
          `Failed to update widget: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    },
  },
} as const

export type Actions = typeof Actions
export default Actions
