// cli/commands/bundle.ts
import { Command } from "@commander-js/extra-typings"
import { PluginMeta } from "@dockstat/typings/schemas"
import { Glob } from "bun"
import type { BuildResult, RepoFile } from "../types"
import { extractMeta } from "../utils/extract"
import { log, printSummary } from "../utils/logger"
import { loadRepo, saveRepo } from "../utils/repo"
import { ajv, validateMeta } from "../utils/validation"

export const bundleCommand = new Command("bundle")
  .description("Bundles all plugins and updates the repository manifest")
  .option("--schema <path>", "Output path for plugin meta schema")
  .option("--minify", "Minify bundled output", true)
  .option("--sourcemap", "Generate sourcemaps", true)
  .action(async (options, cmd) => {
    const globalOptions = cmd.optsWithGlobals() as unknown as { root: string }

    const repoData = await loadRepo(globalOptions.root)
    if (!repoData) {
      console.error(`❌ Repository file not found: ${globalOptions.root}`)
      console.error("   Run 'init' first to create a repository.")
      process.exit(1)
    }

    const { dir: pluginDir, bundle: bundleDir } = repoData.config.plugins

    console.log("\n🚀 DockStat Plugin Bundler\n")

    const glob = new Glob(`${pluginDir}/*/index.ts`)
    const pluginPaths = [...glob.scanSync()]

    if (pluginPaths.length === 0) {
      console.log("⚠️  No plugins found")
      return
    }

    log("🔍", `Found ${pluginPaths.length} plugin(s)`)
    console.log()

    const results: BuildResult[] = []

    for (const pluginPath of pluginPaths) {
      const name = pluginPath.replace("/index.ts", "").replace(`${pluginDir}/`, "")
      const outdir = pluginPath.replace("/index.ts", `/${bundleDir}`)

      log("📦", `Building ${name}...`)

      try {
        const build = await Bun.build({
          entrypoints: [pluginPath],
          outdir,
          minify: options.minify,
          sourcemap: options.sourcemap ? "external" : "none",
          splitting: false,
          env: `${name.toUpperCase()}_*`,
          banner: "/* Bundled by DockStat */",
          target: "bun",
        })

        if (build.logs?.length) {
          for (const entry of build.logs) {
            console.log(`  ⚠️  [${entry.level}] ${entry.message}`)
          }
        }

        const imported = await import(`${process.cwd()}/${outdir}/index.js`)

        if (!imported.default) {
          throw new Error("No default export found. Ensure plugin uses pluginBuilder.")
        }

        const plugin = imported.default
        const meta =
          typeof plugin.build === "function" ? extractMeta(plugin.build()) : extractMeta(plugin)

        if (!validateMeta(meta)) {
          const errors = ajv.errorsText(validateMeta.errors, { separator: "\n    - " })
          throw new Error(`Invalid metadata:\n    - ${errors}`)
        }

        log("✅", name, `${outdir}/index.js`)
        results.push({ name, success: true, meta })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`❌ ${name}: ${message.split("\n")[0]}`)
        results.push({ name, success: false, error: message })
      }
    }

    // Write schema if requested
    if (options.schema) {
      console.log()
      log("📋", "Writing schema", options.schema)
      await Bun.write(options.schema, JSON.stringify(PluginMeta, null, 2))
    }

    // Update repo file
    const successfulPlugins = results.filter((r) => r.success && r.meta).map((r) => r.meta!)
    repoData.content.plugins = successfulPlugins
    await saveRepo(globalOptions.root, repoData)
    log("📋", `Updated ${globalOptions.root}`, `${successfulPlugins.length} plugin(s)`)

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    printSummary(succeeded, failed)

    if (failed > 0) {
      console.log("\n❌ Failed plugins:")
      for (const r of results.filter((r) => !r.success)) {
        console.log(`  - ${r.name}: ${r.error?.split("\n")[0]}`)
      }
      process.exit(1)
    }

    console.log("\n✨ All plugins built successfully!\n")
  })
