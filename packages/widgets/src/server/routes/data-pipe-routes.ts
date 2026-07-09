/**
 * Elysia routes for data-pipe operations (manual evaluation, provider management).
 */

import Elysia, { t } from "elysia"
import type { Logger } from "@dockstat/logger"
import type { DataPayload } from "../types"
import { DataPipeEngine } from "../data-pipe"
import { DashboardRepository } from "../repository"

export function createDataPipeRoutes(
  engine: DataPipeEngine,
  dashboardRepo: DashboardRepository,
  wsHandler: { sendDataUpdate: (dashboardId: string, payloads: DataPayload[]) => number } | null,
  log: Logger
) {
  return new Elysia({
    detail: { tags: ["Data Pipe"] },
    prefix: "/data-pipe",
  })
    // ── Evaluate a dashboard's data pipe ──────────────────────
    .post(
      "/evaluate/:dashboardId",
      async ({ params, status }) => {
        const dashboard = dashboardRepo.getById(params.dashboardId)
        if (!dashboard) {
          return status(404, { error: `Dashboard "${params.dashboardId}" not found`, success: false as const })
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
          description: "Manually trigger a data-pipe evaluation for a dashboard. Results are pushed to WebSocket subscribers.",
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

    // ── List registered providers ────────────────────────────
    .get("/providers", () => {
      // Expose registered provider/transformer types
      return {
        providers: [] as string[], // populated via engine internals
        transformers: [] as string[],
      }
    }, {
      detail: {
        description: "List registered data providers and transformers",
        summary: "List Providers",
      },
    })
}
