/**
 * Elysia routes for widget CRUD operations.
 */

import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import type { Logger } from "@dockstat/logger"
import { WidgetRepository } from "../repository"
import { WidgetImporter } from "../import"

export function createWidgetRoutes(
  widgetRepo: WidgetRepository,
  widgetImporter: WidgetImporter,
  log: Logger
) {
  return new Elysia({
    detail: { tags: ["Widgets"] },
    prefix: "/widgets",
  })
    // ── List all widgets ───────────────────────────────────────
    .get("/", () => {
      try {
        return widgetRepo.list()
      } catch (error) {
        log.error(`Failed to list widgets: ${error}`)
        throw error
      }
    }, {
      detail: {
        description: "List all registered widgets",
        summary: "List Widgets",
      },
    })

    // ── Get widget by id ──────────────────────────────────────
    .get(
      "/:id",
      ({ params, status }) => {
        const widget = widgetRepo.getById(params.id)
        if (!widget) {
          return status(404, { error: `Widget "${params.id}" not found`, success: false as const })
        }
        return widget
      },
      {
        detail: {
          description: "Get a widget by its unique id",
          summary: "Get Widget",
        },
        params: t.Object({
          id: t.String({ description: "Widget id" }),
        }),
        response: {
          404: t.Object({ error: t.String(), success: t.Literal(false) }),
        },
      }
    )

    // ── Create widget ─────────────────────────────────────────
    .post(
      "/",
      ({ body, status }) => {
        try {
          const widget = widgetRepo.create(body)
          return status(201, widget)
        } catch (error) {
          const msg = extractErrorMessage(error, "Failed to create widget")
          return status(400, { error: msg, success: false as const })
        }
      },
      {
        body: t.Object({
          category: t.Optional(t.String()),
          configSchema: t.Any(),
          dataInputs: t.Optional(t.Array(t.String())),
          dataOutputs: t.Optional(t.Array(t.String())),
          defaultConfig: t.Any(),
          description: t.Optional(t.String()),
          icon: t.Optional(t.String()),
          id: t.Optional(t.String()),
          kind: t.String(),
          label: t.String(),
          name: t.String(),
          rendererPath: t.Optional(t.String()),
          version: t.Optional(t.String()),
        }),
        detail: {
          description: "Create a new widget definition",
          summary: "Create Widget",
        },
        response: {
          201: t.Any(),
          400: t.Object({ error: t.String(), success: t.Literal(false) }),
        },
      }
    )

    // ── Update widget ─────────────────────────────────────────
    .put(
      "/:id",
      ({ body, params, status }) => {
        try {
          const widget = widgetRepo.update(params.id, body)
          return widget
        } catch (error) {
          const msg = extractErrorMessage(error, "Failed to update widget")
          return status(400, { error: msg, success: false as const })
        }
      },
      {
        body: t.Object({
          category: t.Optional(t.String()),
          configSchema: t.Optional(t.Any()),
          dataInputs: t.Optional(t.Array(t.String())),
          dataOutputs: t.Optional(t.Array(t.String())),
          defaultConfig: t.Optional(t.Any()),
          description: t.Optional(t.String()),
          icon: t.Optional(t.String()),
          kind: t.Optional(t.String()),
          label: t.Optional(t.String()),
          name: t.Optional(t.String()),
          rendererPath: t.Optional(t.String()),
          version: t.Optional(t.String()),
        }),
        detail: {
          description: "Update an existing widget",
          summary: "Update Widget",
        },
        params: t.Object({
          id: t.String({ description: "Widget id" }),
        }),
        response: {
          400: t.Object({ error: t.String(), success: t.Literal(false) }),
        },
      }
    )

    // ── Delete widget ─────────────────────────────────────────
    .delete(
      "/:id",
      ({ params, status }) => {
        const deleted = widgetRepo.delete(params.id)
        if (!deleted) {
          return status(404, { error: `Widget "${params.id}" not found`, success: false as const })
        }
        return { message: `Widget "${params.id}" deleted`, success: true as const }
      },
      {
        detail: {
          description: "Delete a widget by id",
          summary: "Delete Widget",
        },
        params: t.Object({
          id: t.String({ description: "Widget id" }),
        }),
        response: {
          404: t.Object({ error: t.String(), success: t.Literal(false) }),
        },
      }
    )

    // ── Search widgets ────────────────────────────────────────
    .get(
      "/search/:query",
      ({ params }) => widgetRepo.search(params.query),
      {
        detail: {
          description: "Search widgets by keyword",
          summary: "Search Widgets",
        },
        params: t.Object({
          query: t.String({ description: "Search query" }),
        }),
      }
    )

    // ── Import widgets (JSON) ────────────────────────────────
    .post(
      "/import/json",
      ({ body, status }) => {
        const result = widgetImporter.importJson(body.json)
        return status(result.success ? 200 : 400, result)
      },
      {
        body: t.Object({
          json: t.String({ description: "JSON string of a WidgetManifest" }),
        }),
        detail: {
          description: "Import widgets from a JSON manifest string",
          summary: "Import Widgets from JSON",
        },
        response: {
          200: t.Any(),
          400: t.Any(),
        },
      }
    )

    // ── Import widgets (ZIP) ──────────────────────────────────
    .post(
      "/import/zip",
      async ({ body, status }) => {
        const buffer = body.archive instanceof ArrayBuffer
          ? new Uint8Array(body.archive)
          : body.archive
        const result = await widgetImporter.importZip(buffer)
        return status(result.success ? 200 : 400, result)
      },
      {
        body: t.Object({
          archive: t.Any({ description: "Binary zip archive data" }),
        }),
        detail: {
          description: "Import widgets from a zip archive containing a manifest.json",
          summary: "Import Widgets from ZIP",
        },
        response: {
          200: t.Any(),
          400: t.Any(),
        },
      }
    )
}
