import { writeFileSync } from "node:fs"
import { arch, cpus, platform, totalmem } from "node:os"
import { dockstatAdapter, dockstatBatchAdapter } from "./lib-dockstat"
import { typeboxAdapter } from "./lib-typebox"
import { zodAdapter } from "./lib-zod"
import { presetScenarios, randomScenarios } from "./scenarios"
import {
  bench,
  fmt,
  generateInvalidData,
  generateValidData,
  type LibAdapter,
  Random,
} from "./shared"

// Add new libraries here — each file under lib-*.ts exports an adapter.
const libraries: LibAdapter[] = [dockstatAdapter, zodAdapter]

// ─── Types ────────────────────────────────────────────────────────────────

interface ScenarioResult {
  scenario: string
  compile: Record<string, number>
  validateValid: Record<string, number>
  validateInvalid: Record<string, number>
}

// ─── Run ──────────────────────────────────────────────────────────────────

function runBenchmark(
  adapter: LibAdapter,
  scenarios: { name: string; fields: Record<string, unknown> }[]
): ScenarioResult[] {
  const results: ScenarioResult[] = []
  const rand = new Random(99)

  for (const scenario of scenarios) {
    // Pre-generate data
    const validSamples = Array.from({ length: 200 }, () =>
      generateValidData(scenario as any, new Random(rand.int(0, 999999)))
    )
    const invalidSamples = Array.from({ length: 200 }, () =>
      generateInvalidData(scenario as any, new Random(rand.int(0, 999999)))
    )

    // Compile benchmark
    const compileOps = bench(() => {
      const compiled = adapter.compile(scenario as any)
      compiled.dispose()
    })

    // Validate (valid data) benchmark
    const compiled = adapter.compile(scenario as any)
    let vi = 0
    const validOps = bench(() => {
      adapter.validate(compiled, validSamples[vi++ % validSamples.length])
    })
    compiled.dispose()

    // Validate (invalid data) benchmark
    const compiled2 = adapter.compile(scenario as any)
    let ii = 0
    const invalidOps = bench(() => {
      adapter.validate(compiled2, invalidSamples[ii++ % invalidSamples.length])
    })
    compiled2.dispose()

    results.push({
      compile: { [adapter.name]: compileOps },
      scenario: scenario.name,
      validateInvalid: { [adapter.name]: invalidOps },
      validateValid: { [adapter.name]: validOps },
    })

    console.log(
      `  ${adapter.name.padEnd(20)} | compile: ${fmt(compileOps).padStart(12)} ops/s | valid: ${fmt(validOps).padStart(12)} ops/s | invalid: ${fmt(invalidOps).padStart(12)} ops/s`
    )
  }

  return results
}

// ─── Batch benchmark (measures items/s through validateBatch) ────────────

function runBatchBenchmark(
  adapter: LibAdapter,
  scenarios: { name: string; fields: Record<string, unknown> }[],
  batchSize: number,
): ScenarioResult[] {
  const results: ScenarioResult[] = []
  const rand = new Random(99)

  for (const scenario of scenarios) {
    const validSamples = Array.from({ length: 200 }, () =>
      generateValidData(scenario as any, new Random(rand.int(0, 999999)))
    )
    const invalidSamples = Array.from({ length: 200 }, () =>
      generateInvalidData(scenario as any, new Random(rand.int(0, 999999)))
    )

    const compiled = adapter.compile(scenario as any)

    // Measure batch throughput for valid data (each call validates `batchSize` items)
    let vi = 0
    const validOps = bench(() => {
      const batch: unknown[] = new Array(batchSize)
      for (let i = 0; i < batchSize; i++) {
        batch[i] = validSamples[(vi + i) % validSamples.length]
      }
      vi += batchSize
      adapter.validate(compiled, batch) // batch adapter handles single item internally
    })
    // Adjust to items/s: ops already counted single validate calls inside bench
    // But the adapter wraps single [data] into validateBatch, so ops = validateBatch calls/s
    // Actual items/s = ops * batchSize
    const validItemsPerSec = validOps * batchSize

    // For invalid data
    let ii = 0
    const invalidOps = bench(() => {
      const batch: unknown[] = new Array(batchSize)
      for (let i = 0; i < batchSize; i++) {
        batch[i] = invalidSamples[(ii + i) % invalidSamples.length]
      }
      ii += batchSize
      adapter.validate(compiled, batch)
    })
    const invalidItemsPerSec = invalidOps * batchSize

    compiled.dispose()

    results.push({
      compile: {},
      scenario: scenario.name,
      validateInvalid: { [adapter.name]: invalidItemsPerSec },
      validateValid: { [adapter.name]: validItemsPerSec },
    })

    console.log(
      `  ${adapter.name.padEnd(20)} | valid: ${fmt(validItemsPerSec).padStart(12)} items/s | invalid: ${fmt(invalidItemsPerSec).padStart(12)} items/s (batch=${batchSize})`
    )
  }

  return results
}

// ─── README generation ────────────────────────────────────────────────────

function bestValue(values: Record<string, number>): { name: string; ops: number } {
  let best = { name: "", ops: 0 }
  for (const [name, ops] of Object.entries(values)) {
    if (ops > best.ops) best = { name, ops }
  }
  return best
}

function cell(value: number, best: number): string {
  if (value === best) return `**${fmt(value)}**`
  const ratio = value / best
  return `${fmt(value)} (${ratio.toFixed(2)}×)`
}

function table(
  scenarios: string[],
  metric: "compile" | "validateValid" | "validateInvalid",
  results: ScenarioResult[]
): string {
  const libs = libraries.map((l) => l.name)
  const header = `| Scenario | ${libs.map((l) => l.padEnd(20)).join(" | ")} |`
  const sep = `|----------${libs.map(() => "|---------------------").join("")}|`

  const rows = scenarios.map((scenarioName) => {
    const result = results.find((r) => r.scenario === scenarioName)
    if (!result) return `| ${scenarioName} | ${libs.map(() => "N/A".padEnd(20)).join(" | ")} |`
    const values = result[metric]
    if (Object.keys(values).length === 0) return ""
    const best = bestValue(values).ops
    const cells = libs.map((l) => cell(values[l] ?? 0, best).padEnd(20))
    return `| ${scenarioName.padEnd(16)} | ${cells.join(" | ")} |`
  }).filter(Boolean)

  return [header, sep, ...rows].join("\n")
}

function generateReadme(allResults: ScenarioResult[]): string {
  const scenarios = allResults.map((r) => r.scenario)
  const date = new Date().toISOString().split("T")[0]
  const os = `${platform()} ${arch()}`
  const cpuInfo = cpus()[0]?.model ?? "unknown"
  const cpuCount = cpus().length
  const memGB = Math.round(totalmem() / 1024 / 1024 / 1024)

  return `# @dockstat/validator — Benchmarks

Comparison of schema validation libraries against **@dockstat/validator**.

> Auto-generated on **${date}**. Higher is better. Bold values indicate the fastest.

## Libraries

| Library | Description |
|---------|-------------|
| @dockstat/validator | Rust-backed JSON Schema validator (FFI) |
| zod | TypeScript-first schema validation |
| arktype | Runtime type inference & validation |
| typebox + ajv | JSON Schema builder + Ajv compiler |

## Schema Compilation (schemas/s)

${table(scenarios, "compile", allResults)}

## Validation — Valid Data (validations/s)

${table(scenarios, "validateValid", allResults)}

## Validation — Invalid Data (validations/s)

${table(scenarios, "validateInvalid", allResults)}

## Methodology

- Each benchmark runs a warmup phase followed by an adaptive measurement phase
  targeting at least 250 ms of wall-clock time.
- **Schema compilation** measures the full create → compile → dispose cycle.
- **Validation** measures repeated calls against a single pre-compiled schema,
  cycling through 200 pre-generated data samples.
- Invalid data is generated by mutating a single randomly-chosen field to an
  incorrect type in an otherwise-valid payload.
- Schema definitions are deterministic (seeded PRNG for random scenarios).

## Environment

| Key | Value |
|-----|-------|
| Runtime | Bun ${Bun.version} |
| OS | ${os} |
| CPU | ${cpuInfo} (${cpuCount} cores) |
| Memory | ${memGB} GB |
`
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  console.log("=== @dockstat/validator benchmarks ===\n")

  const scenarios = [...presetScenarios, ...randomScenarios()]
  console.log(`Scenarios: ${scenarios.length}\n`)

  const allResults: ScenarioResult[] = []

  for (const adapter of libraries) {
    console.log(`--- ${adapter.name} ---`)
    const results = runBenchmark(adapter, scenarios as any)
    allResults.push(...results)
    console.log("")
  }

  // Run batch benchmark separately (measures items/s)
  console.log("=== Batch validation benchmarks (items/s) ===\n")
  const BATCH_SIZES = [10, 50]
  for (const batchSize of BATCH_SIZES) {
    console.log(`--- batch size: ${batchSize} ---`)
    const batchAdapter = { ...dockstatBatchAdapter, name: `@dockstat/validator (batch=${batchSize})` }
    const batchResults = runBatchBenchmark(batchAdapter, scenarios as any, batchSize)
    // Merge batch results into allResults for README
    for (const br of batchResults) {
      const existing = allResults.find((r) => r.scenario === br.scenario)
      if (existing) {
        Object.assign(existing.validateValid, br.validateValid)
        Object.assign(existing.validateInvalid, br.validateInvalid)
      }
    }
    console.log("")
  }

  // Merge results by scenario
  const merged: ScenarioResult[] = scenarios.map((s) => ({
    compile: {},
    scenario: s.name,
    validateInvalid: {},
    validateValid: {},
  }))

  for (const result of allResults) {
    const m = merged.find((r) => r.scenario === result.scenario)
    if (!m) continue
    Object.assign(m.compile, result.compile)
    Object.assign(m.validateValid, result.validateValid)
    Object.assign(m.validateInvalid, result.validateInvalid)
  }

  const readme = generateReadme(merged)
  const outPath = new URL("README.md", import.meta.url).pathname
  writeFileSync(outPath, readme, "utf-8")
  console.log(`README written to ${outPath}`)
}

main()
