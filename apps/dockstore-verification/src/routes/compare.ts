import type DB from "@dockstat/sqlite-wrapper"
import Elysia, { t } from "elysia"
import { getPluginVersionsTable, getVerificationsTable } from "../db"

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

export function createCompareRoute(db: DB) {
  const versionsTable = getPluginVersionsTable(db)
  const verificationsTable = getVerificationsTable(db)

  return new Elysia({ prefix: "/compare" })
    .post(
      "/",
      ({ body, set }): CompareResult => {
        // Find the plugin version by hash
        const version = versionsTable.where({ hash: body.pluginHash }).first()

        if (!version) {
          set.status = 404
          return {
            valid: false,
            pluginName: body.pluginName,
            pluginVersion: body.pluginVersion,
            hash: body.pluginHash,
            verified: false,
            securityStatus: "unknown",
            message: "Plugin hash not found in verification database",
          }
        }

        // Check if there's a verification record for this version
        const verification = verificationsTable.where({ plugin_version_id: version.id }).first()

        if (!verification) {
          return {
            valid: true,
            pluginName: body.pluginName,
            pluginVersion: body.pluginVersion,
            hash: body.pluginHash,
            verified: false,
            securityStatus: "unknown",
            message: "Plugin found but not yet verified",
          }
        }

        // Check if the plugin is verified and safe
        const isSafe = verification.verified && verification.security_status === "safe"

        return {
          valid: true,
          pluginName: body.pluginName,
          pluginVersion: body.pluginVersion,
          hash: body.pluginHash,
          verified: verification.verified,
          securityStatus: verification.security_status,
          verifiedBy: verification.verified_by,
          verifiedAt: verification.verified_at,
          notes: verification.notes,
          message: isSafe
            ? "Plugin is verified and marked as safe"
            : verification.security_status === "unsafe"
              ? "WARNING: Plugin is marked as unsafe"
              : "Plugin verification status is unknown",
        }
      },
      {
        body: t.Object({
          pluginName: t.String({ minLength: 1 }),
          pluginHash: t.String({ minLength: 1 }),
          pluginVersion: t.String({ minLength: 1 }),
        }),
        response: {
          200: t.Object({
            valid: t.Boolean(),
            pluginName: t.String(),
            pluginVersion: t.String(),
            hash: t.String(),
            verified: t.Boolean(),
            securityStatus: t.Union([t.Literal("safe"), t.Literal("unsafe"), t.Literal("unknown")]),
            verifiedBy: t.Optional(t.String()),
            verifiedAt: t.Optional(t.Number()),
            notes: t.Optional(t.String()),
            message: t.String(),
          }),
          404: t.Object({
            valid: t.Boolean(),
            pluginName: t.String(),
            pluginVersion: t.String(),
            hash: t.String(),
            verified: t.Boolean(),
            securityStatus: t.Union([t.Literal("safe"), t.Literal("unsafe"), t.Literal("unknown")]),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Compare/Validate Plugin",
          description:
            "Validates a plugin by comparing its hash against the verification database. Returns verification status and security information.",
          tags: ["Compare"],
        },
      }
    )
    .post(
      "/batch",
      ({ body }) => {
        const results: CompareResult[] = []

        for (const plugin of body.plugins) {
          const version = versionsTable.where({ hash: plugin.pluginHash }).first()

          if (!version) {
            results.push({
              valid: false,
              pluginName: plugin.pluginName,
              pluginVersion: plugin.pluginVersion,
              hash: plugin.pluginHash,
              verified: false,
              securityStatus: "unknown",
              message: "Plugin hash not found in verification database",
            })
            continue
          }

          const verification = verificationsTable.where({ plugin_version_id: version.id }).first()

          if (!verification) {
            results.push({
              valid: true,
              pluginName: plugin.pluginName,
              pluginVersion: plugin.pluginVersion,
              hash: plugin.pluginHash,
              verified: false,
              securityStatus: "unknown",
              message: "Plugin found but not yet verified",
            })
            continue
          }

          const isSafe = verification.verified && verification.security_status === "safe"

          results.push({
            valid: true,
            pluginName: plugin.pluginName,
            pluginVersion: plugin.pluginVersion,
            hash: plugin.pluginHash,
            verified: verification.verified,
            securityStatus: verification.security_status,
            verifiedBy: verification.verified_by,
            verifiedAt: verification.verified_at,
            notes: verification.notes,
            message: isSafe
              ? "Plugin is verified and marked as safe"
              : verification.security_status === "unsafe"
                ? "WARNING: Plugin is marked as unsafe"
                : "Plugin verification status is unknown",
          })
        }

        const allSafe = results.every((r) => r.verified && r.securityStatus === "safe")
        const hasUnsafe = results.some((r) => r.securityStatus === "unsafe")

        return {
          results,
          summary: {
            total: results.length,
            verified: results.filter((r) => r.verified).length,
            safe: results.filter((r) => r.securityStatus === "safe").length,
            unsafe: results.filter((r) => r.securityStatus === "unsafe").length,
            unknown: results.filter((r) => r.securityStatus === "unknown").length,
            allSafe,
            hasUnsafe,
          },
        }
      },
      {
        body: t.Object({
          plugins: t.Array(
            t.Object({
              pluginName: t.String({ minLength: 1 }),
              pluginHash: t.String({ minLength: 1 }),
              pluginVersion: t.String({ minLength: 1 }),
            })
          ),
        }),
        detail: {
          summary: "Batch Compare/Validate Plugins",
          description:
            "Validates multiple plugins at once by comparing their hashes against the verification database.",
          tags: ["Compare"],
        },
      }
    )
    .get(
      "/status/:hash",
      ({ params, set }) => {
        const version = versionsTable.where({ hash: params.hash }).first()

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
          version: version.version,
          verified: verification?.verified ?? false,
          securityStatus: verification?.security_status ?? "unknown",
          verifiedBy: verification?.verified_by,
          verifiedAt: verification?.verified_at,
        }
      },
      {
        params: t.Object({
          hash: t.String({ minLength: 1 }),
        }),
        detail: {
          summary: "Get Plugin Status by Hash",
          description: "Quick lookup of a plugin's verification status by its hash.",
          tags: ["Compare"],
        },
      }
    )
}
