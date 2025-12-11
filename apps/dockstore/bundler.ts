import { PluginMeta, WrappedPluginMeta } from "@dockstat/typings/schemas"
import type { PluginMetaType } from "@dockstat/typings/types"
import Ajv from "ajv"
import { Glob } from "bun"
import chalk from "chalk"
import YAML from "js-yaml"

/* --- Color helpers --- */
const clr = {
  header: chalk.cyan.bold,
  ok: chalk.green.bold,
  fail: chalk.red.bold,
  warn: chalk.yellow,
  info: chalk.cyan,
  dim: chalk.gray,
  active: chalk.magenta,
  strong: chalk.white.bold,
  path: chalk.gray.italic,
}

/* --- Constants and setup --- */
const pluginPath = "src/content/plugins"
const ajv = new Ajv({ allErrors: true, strict: false })

/* --- Validation --- */
function validatePluginMeta(meta: unknown) {
  const validate = ajv.compile(WrappedPluginMeta)
  if (!validate(meta)) {
    throw new Error(
      `Invalid Plugin Meta:\n${ajv.errorsText(validate.errors, {
        separator: "\n",
      })}`
    )
  }
}

/* --- Schema generation --- */
async function createSchemas() {
  const schemaRoot = "./.schemas"
  console.log(clr.info("Creating plugin meta schema"))
  await Bun.write(`${schemaRoot}/plugin-meta.schema.json`, JSON.stringify(PluginMeta, null, 2))
}

/* --- Helpers --- */
const getPluginBuildDir = (path: string) => path.replaceAll("/index.ts", "") + "/bundle"

const getPluginManifestPath = (path: string) => path.replaceAll("/index.ts", "") + "/manifest.yml"

const getPluginName = (path: string) =>
  path.replaceAll("/index.ts", "").replaceAll(`${pluginPath}/`, "")

/* --- Discover plugins --- */
const plugins = new Glob(`${pluginPath}/*/index.ts`)
const pluginPaths = [...plugins.scanSync()]

/* --- Build state --- */
type Status = "pending" | "building" | "done" | "failed"
type PluginRecord = {
  name: string
  path: string
  status: Status
  message?: string
  startedAt?: number
  finishedAt?: number
}

const records: PluginRecord[] = pluginPaths.map((p) => ({
  name: getPluginName(p),
  path: p,
  status: "pending",
}))

records.push(
  {
    name: "Generate plugin schemas",
    path: "__TASK__GENERATE_SCHEMAS",
    status: "pending",
  },
  {
    name: "Write repo manifest",
    path: "__TASK__WRITE_REPO_MANIFEST",
    status: "pending",
  }
)

const BUNDLED_PLUGINS: PluginMetaType[] = []

/* --- Error tracking --- */
const errors: {
  name: string
  path: string
  message: string
  stack?: string
  phase: "build" | "schema" | "manifest"
}[] = []

/* --- Progress UI --- */
const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
let spinnerIndex = 0
const barWidth = 40
const CLEAR_UI = !process.env.NO_CLEAR

function formatDuration(ms: number) {
  if (ms < 1000) return clr.dim(`⌛ ${ms}ms`)
  const sec = (ms / 1000).toFixed(1)
  return clr.dim(`${sec}s`)
}

function renderProgress() {
  const total = records.length
  const done = records.filter((r) => r.status === "done").length
  const failed = records.filter((r) => r.status === "failed").length
  const building = records.filter((r) => r.status === "building").length
  const completed = done + failed
  const pct = Math.round((completed / total) * 100)

  const filled = Math.round((completed / total) * barWidth)
  const bar =
    "[" + chalk.green("█".repeat(filled)) + chalk.gray(" ".repeat(barWidth - filled)) + "]"

  if (CLEAR_UI) console.clear()
  console.log(clr.header(`Building plugins — ${completed}/${total} (${pct}%) ${bar}`))
  console.log(
    `${clr.active(`Building: ${building}`)}  ${clr.ok(`Done: ${done}`)}  ${clr.fail(`Failed: ${failed}`)}\n`
  )

  for (const rec of records) {
    const elapsed =
      rec.finishedAt && rec.startedAt ? " " + formatDuration(rec.finishedAt - rec.startedAt) : ""
    let line = ""
    switch (rec.status) {
      case "pending":
        line = `  [ ] ${clr.dim(rec.name)}`
        break
      case "building":
        line = `  [${clr.active(spinnerFrames[spinnerIndex % spinnerFrames.length])}] ${clr.strong(rec.name)}`
        break
      case "done":
        line = `  [${clr.ok("✓")}] ${clr.strong(rec.name)} ${clr.path(rec.message ?? "")}${elapsed}`
        break
      case "failed":
        line = `  [${clr.fail("✗")}] ${clr.strong(rec.name)} ${clr.fail(rec.message ?? "")}${elapsed}`
        break
    }
    console.log(line)
  }
  spinnerIndex++
}

/* --- Build all --- */
async function buildAll() {
  if (records.length === 0) {
    console.log(clr.warn("No plugins found."))
    return
  }

  const tick = setInterval(renderProgress, 10)

  async function buildPlugin(rec: PluginRecord) {
    rec.status = "building"
    rec.startedAt = Date.now()
    try {
      const build = await Bun.build({
        entrypoints: [rec.path],
        outdir: getPluginBuildDir(rec.path),
        minify: true,
        sourcemap: "external",
        splitting: false,
        env: `${rec.name.toUpperCase()}_*`,
        banner: `/*　Bundled by DockStore　*/`,
      })

      const imported = await import(`./${rec.path}`)
      const { meta } = imported as { meta: PluginMetaType }
      validatePluginMeta(meta)

      await Bun.write(getPluginManifestPath(rec.path), YAML.dump(meta))
      rec.status = "done"
      rec.finishedAt = Date.now()
      rec.message = `${getPluginBuildDir(rec.path)}/index.js`
      BUNDLED_PLUGINS.push(meta)

      console.log(`${clr.ok("✔")} ${clr.strong(rec.name)} → ${clr.path(rec.message)}`)
      return { ok: true, rec, build }
    } catch (err) {
      const e = err as Error
      rec.status = "failed"
      rec.finishedAt = Date.now()
      rec.message = e.message
      errors.push({
        name: rec.name,
        path: rec.path,
        message: e.message,
        stack: e.stack,
        phase: "build",
      })
      return { ok: false, rec, error: e }
    }
  }

  const pluginBuildRecords = records.filter((r) => r.path.endsWith("/index.ts"))
  const results = await Promise.allSettled(pluginBuildRecords.map((r) => buildPlugin(r)))

  const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length
  const failedCount = results.filter((r) => r.status === "fulfilled" && !r.value.ok).length

  console.log(
    "\n" +
      clr.header("Plugin build phase complete —") +
      " " +
      clr.ok(`${succeeded} succeeded`) +
      ", " +
      clr.fail(`${failedCount} failed.`) +
      "\n"
  )

  /* Step 1: Generate Schemas */
  {
    const rec = records.find((r) => r.path === "__TASK__GENERATE_SCHEMAS")
    if (rec) {
      rec.status = "building"
      rec.startedAt = Date.now()
      try {
        await createSchemas()
        rec.status = "done"
        rec.finishedAt = Date.now()
        rec.message = "./.schemas/plugin-meta.schema.json"
        console.log(clr.ok("Schemas generated."))
      } catch (err) {
        const e = err as Error
        rec.status = "failed"
        rec.finishedAt = Date.now()
        rec.message = e.message
        errors.push({
          name: rec.name,
          path: rec.path,
          message: e.message,
          stack: e.stack,
          phase: "schema",
        })
        console.error(clr.fail("Schema generation failed: ") + e.message)
      }
    }
  }

  /* Step 2: Write Manifest */
  {
    const rec = records.find((r) => r.path === "__TASK__WRITE_REPO_MANIFEST")
    if (rec) {
      rec.status = "building"
      rec.startedAt = Date.now()
      try {
        const RepoManifestData = { plugins: BUNDLED_PLUGINS }
        await Bun.write("./manifest.yml", YAML.dump(RepoManifestData))
        rec.status = "done"
        rec.finishedAt = Date.now()
        rec.message = "./manifest.yml"
        console.log(clr.ok("Wrote Repo Manifest"))
      } catch (err) {
        const e = err as Error
        rec.status = "failed"
        rec.finishedAt = Date.now()
        rec.message = e.message
        errors.push({
          name: rec.name,
          path: rec.path,
          message: e.message,
          stack: e.stack,
          phase: "manifest",
        })
        console.error(clr.fail("Writing repo manifest failed: ") + e.message)
      }
    }
  }

  renderProgress()
  clearInterval(tick)

  console.log(
    `\n${clr.header("Total —")} ${clr.ok(
      `${records.filter((r) => r.status === "done").length} done`
    )}, ${clr.fail(`${records.filter((r) => r.status === "failed").length} failed.`)}`
  )

  /* Error summary */
  if (errors.length > 0) {
    console.log("\n" + clr.header("========== ERROR SUMMARY =========="))

    for (const e of errors) {
      console.log(
        `\n• ${clr.strong(e.name)} ${clr.dim(`(${e.phase})`)}\n  ${clr.dim("Path:")} ${clr.path(
          e.path
        )}\n  ${clr.dim("Message:")} ${clr.fail(e.message)}`
      )
      if (e.stack) {
        console.log(
          clr.dim("  Stack:\n") +
            e.stack
              .split("\n")
              .map((l) => "    " + clr.dim(l))
              .join("\n")
        )
      }
    }
    console.log(clr.header("\n===================================\n"))
  } else {
    console.log("\n" + clr.ok("✅ No errors encountered.") + "\n")
  }

  return results
}

/* --- Run --- */
await buildAll()
