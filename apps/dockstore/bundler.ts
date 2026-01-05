import { PluginMeta, WrappedPluginMeta } from "@dockstat/typings/schemas"
import type { PluginMetaType } from "@dockstat/typings/types"
import Ajv from "ajv"
import addFormats from "ajv-formats"
import { Glob } from "bun"
import yaml from "js-yaml"

// ============================================================================
// Configuration
// ============================================================================

const PLUGIN_PATH = "src/content/plugins"
const SCHEMA_OUTPUT = "./.schemas/plugin-meta.schema.json"
const MANIFEST_OUTPUT = "./manifest.yaml"

// ============================================================================
// Validation Setup
// ============================================================================

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validateMeta = ajv.compile(WrappedPluginMeta)

// ============================================================================
// Helpers
// ============================================================================

function log(icon: string, message: string, detail?: string) {
  const detailStr = detail ? ` → ${detail}` : ""
  console.log(`${icon} ${message}${detailStr}`)
}

function logError(title: string, error: unknown) {
  console.error(`\n${"=".repeat(70)}`)
  console.error(`❌ ${title}`)
  console.error("=".repeat(70))

  if (error instanceof AggregateError) {
    // Bun.build returns AggregateError on failure
    console.error(`\nBuild errors (${error.errors.length}):`)
    for (const err of error.errors) {
      if (err && typeof err === "object") {
        const buildErr = err as {
          message?: string
          position?: { file?: string; line?: number; column?: number }
          level?: string
        }
        const pos = buildErr.position
        const location = pos ? `${pos.file || "unknown"}:${pos.line || 0}:${pos.column || 0}` : ""
        console.error(`  - [${buildErr.level || "error"}] ${buildErr.message || String(err)}`)
        if (location) {
          console.error(`    at ${location}`)
        }
      } else {
        console.error(`  - ${String(err)}`)
      }
    }
  } else if (error instanceof Error) {
    console.error(`\nMessage: ${error.message}`)
    if (error.cause) {
      console.error(`Cause: ${JSON.stringify(error.cause, null, 2)}`)
    }
    if (error.stack) {
      console.error(`\nStack:\n${error.stack}`)
    }
  } else {
    console.error(String(error))
  }

  console.error(`\n${"=".repeat(70)}\n`)
}

function extractMeta(plugin: Record<string, unknown>): PluginMetaType {
  return {
    name: plugin.name,
    description: plugin.description,
    version: plugin.version,
    repository: plugin.repository,
    repoType: plugin.repoType,
    manifest: plugin.manifest,
    author: plugin.author,
    tags: plugin.tags,
  } as PluginMetaType
}

// ============================================================================
// Build Steps
// ============================================================================

interface BuildResult {
  name: string
  path: string
  success: boolean
  meta?: PluginMetaType
  error?: string
}

async function buildPlugin(pluginPath: string): Promise<BuildResult> {
  const name = pluginPath.replace("/index.ts", "").replace(`${PLUGIN_PATH}/`, "")
  const outdir = pluginPath.replace("/index.ts", "/bundle")

  log("📦", `Building ${name}...`)

  // Step 1: Bundle the plugin
  try {
    const build = await Bun.build({
      entrypoints: [pluginPath],
      outdir,
      minify: true,
      sourcemap: "external",
      splitting: false,
      env: `${name.toUpperCase()}_*`,
      banner: "/* Bundled by DockStore */",
      target: "bun",
    })

    // Check for warnings/logs even on success
    if (build.logs && build.logs.length > 0) {
      console.log(`  ⚠️  Build warnings for ${name}:`)
      for (const logEntry of build.logs) {
        console.log(`    - [${logEntry.level}] ${logEntry.message}`)
      }
    }
  } catch (buildError) {
    logError(`Bundle failed: ${name} (${pluginPath})`, buildError)
    return {
      name,
      path: pluginPath,
      success: false,
      error: buildError instanceof Error ? buildError.message : String(buildError),
    }
  }

  // Step 2: Import and extract metadata
  try {
    const imported = await import(`./${outdir}/index.js`, import.meta)

    if (!imported.default) {
      throw new Error(
        "No default export found. Ensure your plugin uses pluginBuilder and exports the result."
      )
    }

    const plugin = imported.default

    // Step 3: Check if plugin uses .build() method (pluginBuilder pattern)
    let meta: PluginMetaType
    if (typeof plugin.build === "function") {
      // New pluginBuilder pattern - call build() to get the final plugin
      const builtPlugin = plugin.build()
      meta = extractMeta(builtPlugin)
    } else {
      // Fallback: Already built plugin object
      meta = extractMeta(plugin)
    }

    // Step 4: Validate metadata
    if (!validateMeta(meta)) {
      const errors = ajv.errorsText(validateMeta.errors, { separator: "\n  - " })
      throw new Error(`Invalid plugin metadata:\n  - ${errors}`)
    }

    log("✅", name, `${outdir}/index.js`)
    return { name, path: pluginPath, success: true, meta }
  } catch (importError) {
    logError(`Import/validation failed: ${name}`, importError)
    return {
      name,
      path: pluginPath,
      success: false,
      error: importError instanceof Error ? importError.message : String(importError),
    }
  }
}

async function writeSchemas(): Promise<boolean> {
  try {
    log("📋", "Writing plugin meta schema...")
    await Bun.write(SCHEMA_OUTPUT, JSON.stringify(PluginMeta, null, 2))
    log("✅", "Schema written", SCHEMA_OUTPUT)
    return true
  } catch (error) {
    logError("Failed to write schemas", error)
    return false
  }
}

async function writeManifest(plugins: PluginMetaType[]): Promise<boolean> {
  try {
    log("📋", "Writing repository manifest...")
    const content = yaml.dump(
      { plugins },
      { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false }
    )
    await Bun.write(
      MANIFEST_OUTPUT,
      `# Auto-generated repository manifest - DO NOT EDIT\n${content}`
    )
    log("✅", "Manifest written", MANIFEST_OUTPUT)
    return true
  } catch (error) {
    logError("Failed to write manifest", error)
    return false
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("\n🚀 DockStore Plugin Bundler\n")

  // Discover plugins
  const glob = new Glob(`${PLUGIN_PATH}/*/index.ts`)
  const pluginPaths = [...glob.scanSync()]

  if (pluginPaths.length === 0) {
    log("⚠️", "No plugins found")
    return
  }

  log("🔍", `Found ${pluginPaths.length} plugin(s)\n`)

  // Build plugins sequentially for clearer logs
  const results: BuildResult[] = []
  for (const path of pluginPaths) {
    results.push(await buildPlugin(path))
  }

  console.log("")

  // Generate schemas
  await writeSchemas()

  // Write manifest with successful plugins
  // biome-ignore lint/style/noNonNullAssertion: Meta was checked before
  const successfulPlugins = results.filter((r) => r.success && r.meta).map((r) => r.meta!)
  await writeManifest(successfulPlugins)

  // Summary
  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  console.log(`\n${"=".repeat(50)}`)
  console.log(`📊 Summary: ${succeeded} succeeded, ${failed} failed`)
  console.log("=".repeat(50))

  if (failed > 0) {
    console.log("\n❌ Failed plugins:")
    for (const r of results.filter((r) => !r.success)) {
      console.log(`  - ${r.name}: ${r.error?.split("\n")[0]}`)
    }
    console.log("")
    process.exit(1)
  }

  console.log("\n✨ All plugins built successfully!\n")
}

await main()
