/**
 * Elysia routes for data-pipe operations (manual evaluation, provider management).
 */

import type { Logger } from "@dockstat/logger"
import Elysia, { t } from "elysia"
import type { DataPipeEngine } from "../data-pipe/engine"
import { NODE_TEMPLATES } from "../data-pipe/registry"
import type { DashboardRepository } from "../repository"
import type { DataPayload } from "../types"

export function createDataPipeRoutes(
  engine: DataPipeEngine,
  dashboardRepo: DashboardRepository,
  wsHandler: { sendDataUpdate: (dashboardId: string, payloads: DataPayload[]) => number } | null,
  log: Logger
) {
  return (
    new Elysia({
      detail: { tags: ["Data Pipe"] },
      prefix: "/data-pipe",
    })
      // ── List available node templates ───────────────────────
      .get("/templates", () => NODE_TEMPLATES, {
        detail: {
          description: "List all available data-pipe node templates for the flow editor",
          summary: "List Node Templates",
        },
      })

      // ── Evaluate a dashboard's data pipe ──────────────────────
      .post(
        "/evaluate/:dashboardId",
        async ({ params, status }) => {
          const dashboard = dashboardRepo.getById(params.dashboardId)
          if (!dashboard) {
            return status(404, {
              error: `Dashboard "${params.dashboardId}" not found`,
              success: false as const,
            })
          }

          try {
            const payloads = await engine.evaluate(params.dashboardId, dashboard.dataPipe)

            // Push to WebSocket subscribers if handler is available
            if (wsHandler && payloads.length > 0) {
              wsHandler.sendDataUpdate(params.dashboardId, payloads)
            }

            return {
              dashboardId: params.dashboardId,
              payloads,
              success: true as const,
              timestamp: new Date().toISOString(),
            }
          } catch (error) {
            log.error(`Data pipe evaluation failed for "${params.dashboardId}": ${error}`)
            return status(500, {
              error: `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
              success: false as const,
            })
          }
        },
        {
          detail: {
            description:
              "Manually trigger a data-pipe evaluation for a dashboard. Results are pushed to WebSocket subscribers.",
            summary: "Evaluate Data Pipe",
          },
          params: t.Object({
            dashboardId: t.String({ description: "Dashboard id" }),
          }),
          response: {
            404: t.Object({ error: t.String(), success: t.Literal(false) }),
            500: t.Object({ error: t.String(), success: t.Literal(false) }),
          },
        }
      )

      // ── Update a dashboard's data pipe graph ───────────────
      .put(
        "/:dashboardId",
        ({ body, params, status }) => {
          const dashboard = dashboardRepo.getById(params.dashboardId)
          if (!dashboard) {
            return status(404, {
              error: `Dashboard "${params.dashboardId}" not found`,
              success: false as const,
            })
          }
          try {
            const updated = dashboardRepo.update(params.dashboardId, { dataPipe: body })
            return { dashboard: updated, success: true as const }
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error)
            log.error(`Failed to update data pipe for "${params.dashboardId}": ${msg}`)
            return status(500, { error: msg, success: false as const })
          }
        },
        {
          body: t.Object({
            edges: t.Array(
              t.Object({
                data: t.Optional(t.Any()),
                id: t.String(),
                label: t.Optional(t.String()),
                source: t.String(),
                sourceHandle: t.Optional(t.String()),
                target: t.String(),
                targetHandle: t.Optional(t.String()),
              })
            ),
            nodes: t.Array(
              t.Object({
                data: t.Object(
                  {
                    label: t.String(),
                    // Allow any additional config keys
                  },
                  { additionalProperties: true }
                ),
                id: t.String(),
                position: t.Object({ x: t.Number(), y: t.Number() }),
                type: t.String(),
              })
            ),
          }),
          detail: {
            description: "Update the data-pipe graph for a dashboard",
            summary: "Update Data Pipe Graph",
          },
          params: t.Object({
            dashboardId: t.String({ description: "Dashboard id" }),
          }),
          response: {
            404: t.Object({ error: t.String(), success: t.Literal(false) }),
            500: t.Object({ error: t.String(), success: t.Literal(false) }),
          },
        }
      )

      // ── List registered providers ────────────────────────────
      .get(
        "/providers",
        () => {
          // Expose registered provider/transformer types
          return {
            providers: [] as string[], // populated via engine internals
            transformers: [] as string[],
          }
        },
        {
          detail: {
            description: "List registered data providers and transformers",
            summary: "List Providers",
          },
        }
      )
  )
}
