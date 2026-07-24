/**
 * Elysia routes for dashboard CRUD operations.
 */

import type { Logger } from "@dockstat/logger"
import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import type { DashboardImporter } from "../import"
import type { DashboardRepository } from "../repository"

export function createDashboardRoutes(
  dashboardRepo: DashboardRepository,
  dashboardImporter: DashboardImporter,
  log: Logger
) {
  return (
    new Elysia({
      detail: { tags: ["Dashboards"] },
      prefix: "/dashboards",
    })
      // ── List all dashboards ───────────────────────────────────
      .get(
        "/",
        () => {
          try {
            return dashboardRepo.list()
          } catch (error) {
            log.error(`Failed to list dashboards: ${error}`)
            throw error
          }
        },
        {
          detail: {
            description: "List all dashboards",
            summary: "List Dashboards",
          },
        }
      )

      // ── Get dashboard by id ──────────────────────────────────
      .get(
        "/:id",
        ({ params, status }) => {
          const dashboard = dashboardRepo.getById(params.id)
          if (!dashboard) {
            return status(404, {
              error: `Dashboard "${params.id}" not found`,
              success: false as const,
            })
          }
          return dashboard
        },
        {
          detail: {
            description: "Get a dashboard by its unique id",
            summary: "Get Dashboard",
          },
          params: t.Object({
            id: t.String({ description: "Dashboard id" }),
          }),
          response: {
            404: t.Object({ error: t.String(), success: t.Literal(false) }),
          },
        }
      )

      // ── Get default dashboard ─────────────────────────────────
      .get(
        "/default",
        () => {
          const dashboard = dashboardRepo.getDefault()
          if (!dashboard) {
            return { error: "No default dashboard set", success: false as const }
          }
          return dashboard
        },
        {
          detail: {
            description: "Get the currently set default dashboard",
            summary: "Get Default Dashboard",
          },
        }
      )

      // ── Create dashboard ──────────────────────────────────────
      .post(
        "/",
        ({ body, status }) => {
          try {
            const dashboard = dashboardRepo.create(body)
            return status(201, dashboard)
          } catch (error) {
            const msg = extractErrorMessage(error, "Failed to create dashboard")
            return status(400, { error: msg, success: false as const })
          }
        },
        {
          body: t.Object({
            dataPipe: t.Optional(t.Any()),
            description: t.Optional(t.String()),
            isDefault: t.Optional(t.Boolean()),
            label: t.String(),
            layouts: t.Optional(t.Any()),
            name: t.String(),
            widgets: t.Optional(t.Any()),
          }),
          detail: {
            description: "Create a new dashboard",
            summary: "Create Dashboard",
          },
          response: {
            201: t.Any(),
            400: t.Object({ error: t.String(), success: t.Literal(false) }),
          },
        }
      )

      // ── Update dashboard ──────────────────────────────────────
      .put(
        "/:id",
        ({ body, params, status }) => {
          try {
            const dashboard = dashboardRepo.update(params.id, body)
            return dashboard
          } catch (error) {
            const msg = extractErrorMessage(error, "Failed to update dashboard")
            return status(400, { error: msg, success: false as const })
          }
        },
        {
          body: t.Object({
            dataPipe: t.Optional(t.Any()),
            description: t.Optional(t.String()),
            isDefault: t.Optional(t.Boolean()),
            label: t.Optional(t.String()),
            layouts: t.Optional(t.Any()),
            name: t.Optional(t.String()),
            widgets: t.Optional(t.Any()),
          }),
          detail: {
            description: "Update an existing dashboard",
            summary: "Update Dashboard",
          },
          params: t.Object({
            id: t.String({ description: "Dashboard id" }),
          }),
          response: {
            400: t.Object({ error: t.String(), success: t.Literal(false) }),
          },
        }
      )

      // ── Delete dashboard ─────────────────────────────────────
      .delete(
        "/:id",
        ({ params, status }) => {
          const deleted = dashboardRepo.delete(params.id)
          if (!deleted) {
            return status(404, {
              error: `Dashboard "${params.id}" not found`,
              success: false as const,
            })
          }
          return { message: `Dashboard "${params.id}" deleted`, success: true as const }
        },
        {
          detail: {
            description: "Delete a dashboard by id",
            summary: "Delete Dashboard",
          },
          params: t.Object({
            id: t.String({ description: "Dashboard id" }),
          }),
          response: {
            404: t.Object({ error: t.String(), success: t.Literal(false) }),
          },
        }
      )

      // ── Set default dashboard ─────────────────────────────────
      .post(
        "/:id/set-default",
        ({ params, status }) => {
          const result = dashboardRepo.setDefault(params.id)
          if (!result) {
            return status(404, {
              error: `Dashboard "${params.id}" not found`,
              success: false as const,
            })
          }
          return { message: `Dashboard "${params.id}" set as default`, success: true as const }
        },
        {
          detail: {
            description: "Set a dashboard as the system default",
            summary: "Set Default Dashboard",
          },
          params: t.Object({
            id: t.String({ description: "Dashboard id" }),
          }),
          response: {
            404: t.Object({ error: t.String(), success: t.Literal(false) }),
          },
        }
      )

      // ── Import dashboard (JSON) ──────────────────────────────
      .post(
        "/import/json",
        ({ body, status }) => {
          const partial = body.partial ?? false
          const result = dashboardImporter.importJson(body.json, partial)
          return status(result.success ? 200 : 400, result)
        },
        {
          body: t.Object({
            json: t.String({ description: "JSON string of a DashboardExportManifest" }),
            partial: t.Optional(
              t.Boolean({ description: "Allow import even with missing widgets" })
            ),
          }),
          detail: {
            description:
              "Import a dashboard from a JSON manifest string. Validates that all required widgets exist.",
            summary: "Import Dashboard from JSON",
          },
          response: {
            200: t.Any(),
            400: t.Any(),
          },
        }
      )

      // ── Import dashboard (ZIP) ────────────────────────────────
      .post(
        "/import/zip",
        async ({ body, status }) => {
          const buffer =
            body.archive instanceof ArrayBuffer ? new Uint8Array(body.archive) : body.archive
          const partial = body.partial ?? false
          const result = await dashboardImporter.importZip(buffer, partial)
          return status(result.success ? 200 : 400, result)
        },
        {
          body: t.Object({
            archive: t.Any({ description: "Binary zip archive data" }),
            partial: t.Optional(
              t.Boolean({ description: "Allow import even with missing widgets" })
            ),
          }),
          detail: {
            description:
              "Import a dashboard from a zip archive containing a manifest.json. Validates that all required widgets exist.",
            summary: "Import Dashboard from ZIP",
          },
          response: {
            200: t.Any(),
            400: t.Any(),
          },
        }
      )
  )
}
