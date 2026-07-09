/**
 * WidgetImporter — validates and imports widget manifests.
 *
 * Supports importing from:
 *   - Parsed JSON (in-memory WidgetManifest)
 *   - Zip archives containing a `manifest.json`
 */

import type { Logger } from "@dockstat/logger"
import type { ImportResult, WidgetManifest } from "../types"
import { WidgetRepository } from "../repository"

export class WidgetImporter {
  constructor(
    private widgetRepo: WidgetRepository,
    private log: Logger
  ) {}

  /**
   * Import widgets from an already-parsed manifest.
   */
  importManifest(manifest: WidgetManifest): ImportResult {
    const result: ImportResult = {
      data: [],
      errors: [],
      messages: [],
      success: false,
      warnings: [],
    }

    // Basic manifest validation
    if (!manifest.manifestVersion) {
      result.errors.push("Manifest is missing 'manifestVersion'")
      return result
    }

    if (!manifest.widgets || !Array.isArray(manifest.widgets)) {
      result.errors.push("Manifest is missing 'widgets' array")
      return result
    }

    if (manifest.widgets.length === 0) {
      result.warnings.push("Manifest contains no widgets")
      return result
    }

    result.messages.push(`Importing ${manifest.widgets.length} widget(s) from manifest v${manifest.manifestVersion}`)

    for (const widget of manifest.widgets) {
      try {
        // Validate required fields
        if (!widget.id || !widget.name || !widget.kind) {
          result.errors.push(`Widget is missing required fields (id, name, or kind): ${JSON.stringify(widget)}`)
          continue
        }

        // Check if widget already exists
        const existing = this.widgetRepo.getById(widget.id)
        if (existing) {
          result.warnings.push(`Widget "${widget.name}" (${widget.id}) already exists — updating`)
          this.widgetRepo.update(widget.id, widget)
          result.data!.push(existing)
        } else {
          const created = this.widgetRepo.create(widget)
          result.data!.push(created)
          result.messages.push(`Imported widget "${widget.name}" (${widget.id})`)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        result.errors.push(`Failed to import widget "${widget.name ?? "unknown"}": ${message}`)
      }
    }

    result.success = result.errors.length === 0
    return result
  }

  /**
   * Import widgets from a JSON string.
   */
  importJson(jsonString: string): ImportResult {
    try {
      const manifest = JSON.parse(jsonString) as WidgetManifest
      return this.importManifest(manifest)
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
   * Import widgets from a zip archive (Buffer or Blob).
   *
   * The archive must contain a `manifest.json` at its root.
   * Optionally, the archive may include a `widgets/` directory with
   * additional assets referenced by widget rendererPath entries.
   */
  async importZip(archiveData: ArrayBuffer | Uint8Array): Promise<ImportResult> {
    const result: ImportResult = {
      data: [],
      errors: [],
      messages: [],
      success: false,
      warnings: [],
    }

    try {
      // @ts-expect-error unzipit has no type declarations
      const unzip = await import("unzipit") as any
      const { entries } = await unzip.unzip(archiveData)

      // Find manifest.json
      const manifestEntry = entries["manifest.json"]
      if (!manifestEntry) {
        result.errors.push("Archive does not contain a 'manifest.json' at its root")
        return result
      }

      const manifestJson = await manifestEntry.text()
      const manifest = JSON.parse(manifestJson) as WidgetManifest

      this.log.info(`Extracted manifest from zip (v${manifest.manifestVersion})`)
      result.messages.push("Extracted manifest from zip archive")

      // Import the manifest
      const importResult = this.importManifest(manifest)
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
}
