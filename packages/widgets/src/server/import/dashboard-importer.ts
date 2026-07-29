/**
 * DashboardImporter — validates and imports dashboard manifests.
 *
 * When importing a dashboard, it checks that all referenced widget ids
 * exist in the current system.  Missing widgets are reported as errors
 * but the import can optionally proceed in "partial" mode.
 */

import type { Logger } from "@dockstat/logger"
import type { DashboardRepository, WidgetRepository } from "../repository"
import type {
  DashboardExportManifest,
  DataPipeGraph,
  ImportResult,
  PlacedWidget,
  WidgetDefinition,
} from "../types"

export class DashboardImporter {
  constructor(
    private dashboardRepo: DashboardRepository,
    private widgetRepo: WidgetRepository,
    private log: Logger
  ) {}

  /**
   * Import a dashboard from an export manifest.
   *
   * @param manifest - The parsed dashboard export manifest
   * @param partial - Allow import even if some widgets are missing
   */
  importManifest(manifest: DashboardExportManifest, partial = false): ImportResult {
    const result: ImportResult = {
      data: [],
      errors: [],
      messages: [],
      success: false,
      warnings: [],
    }

    if (!manifest.manifestVersion) {
      result.errors.push("Manifest is missing 'manifestVersion'")
      return result
    }

    if (!manifest.dashboard) {
      result.errors.push("Manifest is missing 'dashboard' data")
      return result
    }

    const dash = manifest.dashboard

    // Validate required dashboard fields
    if (!dash.name || !dash.label) {
      result.errors.push("Dashboard is missing required fields (name or label)")
      return result
    }

    result.messages.push(`Importing dashboard "${dash.label}"`)

    // Import bundled widgets first (if any)
    if (manifest.bundledWidgets && manifest.bundledWidgets.length > 0) {
      result.messages.push(`Found ${manifest.bundledWidgets.length} bundled widget(s)`)

      for (const widgetDef of manifest.bundledWidgets) {
        const existing = this.widgetRepo.getById(widgetDef.id)
        if (!existing) {
          try {
            this.widgetRepo.create(widgetDef)
            result.messages.push(`Bundled widget "${widgetDef.name}" imported`)
          } catch (error) {
            result.warnings.push(
              `Failed to import bundled widget "${widgetDef.name}": ${error instanceof Error ? error.message : String(error)}`
            )
          }
        } else {
          result.warnings.push(`Bundled widget "${widgetDef.name}" already exists, skipping`)
        }
      }
    }

    // Validate that all referenced widgets exist
    const widgetIds = this.extractWidgetIds(dash.widgets)
    const validation = this.widgetRepo.validateIds(widgetIds)

    if (validation.missing.length > 0) {
      const missingStr = validation.missing.join(", ")
      if (partial) {
        result.warnings.push(`Missing widgets (partial import): ${missingStr}`)
      } else {
        result.errors.push(`Missing required widgets: ${missingStr}`)
      }
    }

    if (!partial && result.errors.length > 0) {
      return result
    }

    // Check for name conflict
    const existingDash = this.dashboardRepo.getByName(dash.name)
    if (existingDash) {
      // Update existing dashboard
      try {
        const updated = this.dashboardRepo.update(existingDash.id, {
          dataPipe: (dash.dataPipe ?? { edges: [], nodes: [] }) as DataPipeGraph,
          description: dash.description ?? "",
          label: dash.label,
          layouts: dash.layouts ?? {},
          widgets: (dash.widgets ?? []) as PlacedWidget[],
        })
        result.data!.push(updated)
        result.messages.push(`Updated existing dashboard "${dash.name}"`)
      } catch (error) {
        result.errors.push(
          `Failed to update dashboard "${dash.name}": ${error instanceof Error ? error.message : String(error)}`
        )
        return result
      }
    } else {
      // Create new dashboard
      try {
        const created = this.dashboardRepo.create({
          dataPipe: (dash.dataPipe ?? { edges: [], nodes: [] }) as DataPipeGraph,
          description: dash.description ?? "",
          label: dash.label,
          layouts: dash.layouts ?? {},
          name: dash.name,
          widgets: (dash.widgets ?? []) as PlacedWidget[],
        })
        result.data!.push(created)
        result.messages.push(`Created dashboard "${dash.name}"`)
      } catch (error) {
        result.errors.push(
          `Failed to create dashboard "${dash.name}": ${error instanceof Error ? error.message : String(error)}`
        )
        return result
      }
    }

    result.success = result.errors.length === 0
    return result
  }

  /**
   * Import from a JSON string.
   */
  importJson(jsonString: string, partial?: boolean): ImportResult {
    try {
      const manifest = JSON.parse(jsonString) as DashboardExportManifest
      return this.importManifest(manifest, partial)
    } catch (error) {
      return {
        data: [],
        errors: ["Invalid JSON: " + (error instanceof Error ? error.message : String(error))],
        messages: [],
        success: false,
        warnings: [],
      }
    }
  }

  /**
   * Import from a zip archive.
   */
  async importZip(archiveData: ArrayBuffer | Uint8Array, partial?: boolean): Promise<ImportResult> {
    const result: ImportResult = {
      data: [],
      errors: [],
      messages: [],
      success: false,
      warnings: [],
    }

    try {
      // @ts-expect-error unzipit has no type declarations
      const unzip = (await import("unzipit")) as any
      const { entries } = await unzip.unzip(archiveData)

      const manifestEntry = entries["manifest.json"]
      if (!manifestEntry) {
        result.errors.push("Archive does not contain a 'manifest.json' at its root")
        return result
      }

      const manifestJson = await manifestEntry.text()
      const manifest = JSON.parse(manifestJson) as DashboardExportManifest

      this.log.info(`Extracted dashboard manifest from zip`)
      result.messages.push("Extracted manifest from zip archive")

      const importResult = this.importManifest(manifest, partial)
      result.data = importResult.data
      result.errors.push(...importResult.errors)
      result.messages.push(...importResult.messages)
      result.warnings.push(...importResult.warnings)
      result.success = importResult.success
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      result.errors.push(`Failed to read zip archive: ${message}`)
    }

    return result
  }

  /**
   * Extract widget ids from placed widgets array.
   */
  private extractWidgetIds(widgets: unknown[]): string[] {
    if (!Array.isArray(widgets)) return []
    return widgets
      .map((w) => (w as { widgetId?: string }).widgetId)
      .filter((id): id is string => typeof id === "string")
  }
}
