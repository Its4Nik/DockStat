import Elysia, { t } from "elysia"
import { pluginVersionsTable, verificationsTable } from "../db"

export interface CompareResult {
  valid: boolean
  pluginName: string
  pluginVersion: string
  hash: string
  verified: boolean
  securityStatus: "safe" | "unsafe" | "unknown"
  verifiedBy?: string
  verifiedAt?: number
  notes?: string
  message: string
}

const compareRoutes = new Elysia({ prefix: "/compare" })
  .post(
    "/",
    ({ body, set }): CompareResult => {
      // Find the plugin version by hash
      const version = pluginVersionsTable.where({ hash: body.pluginHash }).first()

      if (!version) {
        set.status = 404
        return {
          hash: body.pluginHash,
          message: "Plugin hash not found in verification database",
          pluginName: body.pluginName,
          pluginVersion: body.pluginVersion,
          securityStatus: "unknown",
          valid: false,
          verified: false,
        }
      }

      // Check if there's a verification record for this version
      const verification = verificationsTable.where({ plugin_version_id: version.id }).first()

      if (!verification) {
        return {
          hash: body.pluginHash,
          message: "Plugin found but not yet verified",
          pluginName: body.pluginName,
          pluginVersion: body.pluginVersion,
          securityStatus: "unknown",
          valid: true,
          verified: false,
        }
      }

      // Check if the plugin is verified and safe
      const isSafe = verification.verified && verification.security_status === "safe"

      return {
        hash: body.pluginHash,
        message: isSafe
          ? "Plugin is verified and marked as safe"
          : verification.security_status === "unsafe"
            ? "WARNING: Plugin is marked as unsafe"
            : "Plugin verification status is unknown",
        notes: verification.notes,
        pluginName: body.pluginName,
        pluginVersion: body.pluginVersion,
        securityStatus: verification.security_status,
        valid: true,
        verified: verification.verified,
        verifiedAt: verification.verified_at,
        verifiedBy: verification.verified_by,
      }
    },
    {
      body: t.Object({
        pluginHash: t.String({ minLength: 1 }),
        pluginName: t.String({ minLength: 1 }),
        pluginVersion: t.String({ minLength: 1 }),
      }),
      detail: {
        description:
          "Validates a plugin by comparing its hash against the verification database. Returns verification status and security information.",
        summary: "Compare/Validate Plugin",
        tags: ["Compare"],
      },
      response: {
        200: t.Object({
          hash: t.String(),
          message: t.String(),
          notes: t.Optional(t.String()),
          pluginName: t.String(),
          pluginVersion: t.String(),
          securityStatus: t.Union([t.Literal("safe"), t.Literal("unsafe"), t.Literal("unknown")]),
          valid: t.Boolean(),
          verified: t.Boolean(),
          verifiedAt: t.Optional(t.Number()),
          verifiedBy: t.Optional(t.String()),
        }),
        404: t.Object({
          hash: t.String(),
          message: t.String(),
          pluginName: t.String(),
          pluginVersion: t.String(),
          securityStatus: t.Union([t.Literal("safe"), t.Literal("unsafe"), t.Literal("unknown")]),
          valid: t.Boolean(),
          verified: t.Boolean(),
        }),
      },
    }
  )
  .post(
    "/batch",
    ({ body }) => {
      const results: CompareResult[] = []

      for (const plugin of body.plugins) {
        const version = pluginVersionsTable.where({ hash: plugin.pluginHash }).first()

        if (!version) {
          results.push({
            hash: plugin.pluginHash,
            message: "Plugin hash not found in verification database",
            pluginName: plugin.pluginName,
            pluginVersion: plugin.pluginVersion,
            securityStatus: "unknown",
            valid: false,
            verified: false,
          })
          continue
        }

        const verification = verificationsTable.where({ plugin_version_id: version.id }).first()

        if (!verification) {
          results.push({
            hash: plugin.pluginHash,
            message: "Plugin found but not yet verified",
            pluginName: plugin.pluginName,
            pluginVersion: plugin.pluginVersion,
            securityStatus: "unknown",
            valid: true,
            verified: false,
          })
          continue
        }

        const isSafe = verification.verified && verification.security_status === "safe"

        results.push({
          hash: plugin.pluginHash,
          message: isSafe
            ? "Plugin is verified and marked as safe"
            : verification.security_status === "unsafe"
              ? "WARNING: Plugin is marked as unsafe"
              : "Plugin verification status is unknown",
          notes: verification.notes,
          pluginName: plugin.pluginName,
          pluginVersion: plugin.pluginVersion,
          securityStatus: verification.security_status,
          valid: true,
          verified: verification.verified,
          verifiedAt: verification.verified_at,
          verifiedBy: verification.verified_by,
        })
      }

      const allSafe = results.every((r) => r.verified && r.securityStatus === "safe")
      const hasUnsafe = results.some((r) => r.securityStatus === "unsafe")

      return {
        results,
        summary: {
          allSafe,
          hasUnsafe,
          safe: results.filter((r) => r.securityStatus === "safe").length,
          total: results.length,
          unknown: results.filter((r) => r.securityStatus === "unknown").length,
          unsafe: results.filter((r) => r.securityStatus === "unsafe").length,
          verified: results.filter((r) => r.verified).length,
        },
      }
    },
    {
      body: t.Object({
        plugins: t.Array(
          t.Object({
            pluginHash: t.String({ minLength: 1 }),
            pluginName: t.String({ minLength: 1 }),
            pluginVersion: t.String({ minLength: 1 }),
          })
        ),
      }),
      detail: {
        description:
          "Validates multiple plugins at once by comparing their hashes against the verification database.",
        summary: "Batch Compare/Validate Plugins",
        tags: ["Compare"],
      },
    }
  )
  .get(
    "/status/:hash",
    ({ params, set }) => {
      const version = pluginVersionsTable.where({ hash: params.hash }).first()

      if (!version) {
        set.status = 404
        return {
          found: false,
          hash: params.hash,
          message: "Hash not found in database",
        }
      }

      const verification = verificationsTable.where({ plugin_version_id: version.id }).first()

      return {
        found: true,
        hash: params.hash,
        securityStatus: verification?.security_status ?? "unknown",
        verified: verification?.verified ?? false,
        verifiedAt: verification?.verified_at,
        verifiedBy: verification?.verified_by,
        version: version.version,
      }
    },
    {
      detail: {
        description: "Quick lookup of a plugin's verification status by its hash.",
        summary: "Get Plugin Status by Hash",
        tags: ["Compare"],
      },
      params: t.Object({
        hash: t.String({ minLength: 1 }),
      }),
    }
  )

export default compareRoutes
