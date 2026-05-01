import { Command } from "commander"
import { OutlineSync } from "./sync"
import { resolveConfig, createSampleConfig } from "./config"
import { c, icon } from "./ui"

const program = new Command()

// ── Shared option definitions ──────────────────────────────────────────────

interface GlobalOptions {
  url?: string
  token?: string
  output?: string
  config?: string
  include?: string
  exclude?: string
  verbose?: boolean
  dryRun?: boolean
  createMissing?: boolean
  defaultCollection?: string
}

function addSharedOptions(cmd: Command): Command {
  return cmd
    .option("-u, --url <url>", "Outline instance URL")
    .option("-t, --token <token>", "Outline API token")
    .option("-o, --output <dir>", "Output directory")
    .option("-c, --config <path>", "Config file path")
    .option("-i, --include <collections>", "Comma-separated collections to include")
    .option("-e, --exclude <collections>", "Comma-separated collections to exclude")
    .option("-v, --verbose", "Enable debug/trace logging")
    .option("--dry-run", "Show what would happen without making changes")
    .option("--create-missing", "Create documents on Outline when not found (useful in CI)")
    .option("--default-collection <id>", "Default collection ID for creating new documents")
}

// ── ASCII banner ───────────────────────────────────────────────────────────

function printBanner(): void {
  console.log(
    c.bold(c.cyan(`
  ${icon.sync} Outline Sync`)),
  )
  console.log(c.dim("  " + "\u2500".repeat(30)))
}

// ── Program setup ──────────────────────────────────────────────────────────

program
  .name("outline-sync")
  .description("Bidirectional sync between Outline wiki and local Markdown files")
  .version("2.0.0")
  .hook("preAction", () => {
    printBanner()
  })

// ── sync ───────────────────────────────────────────────────────────────────

addSharedOptions(
  program
    .command("sync")
    .description("One-time sync: pull documents from Outline to local"),
).action(async (options: GlobalOptions) => {
  const config = await resolveConfig(options)
  const sync = new OutlineSync(config, { verbose: config.verbose })
  await sync.syncDown()
})

// ── watch ──────────────────────────────────────────────────────────────────

addSharedOptions(
  program
    .command("watch")
    .description("Watch for local changes and sync bidirectionally"),
).action(async (options: GlobalOptions) => {
  const config = await resolveConfig(options)
  const sync = new OutlineSync(config, { verbose: config.verbose })
  await sync.watch()
})

// ── ci ─────────────────────────────────────────────────────────────────────

addSharedOptions(
  program
    .command("ci")
    .description("CI/CD mode: pull from Outline, then push local changes that are newer"),
).action(async (options: GlobalOptions) => {
  const config = await resolveConfig(options)
  const sync = new OutlineSync(config, { verbose: config.verbose })
  await sync.ciSync()
})

// ── push ───────────────────────────────────────────────────────────────────

addSharedOptions(
  program
    .command("push")
    .description("Push local changes to Outline (compares against remote timestamps)")
    .option("-f, --force", "Force push all local files with IDs, ignoring timestamps"),
).action(async (options: GlobalOptions & { force?: boolean }) => {
  const config = await resolveConfig(options)
  const sync = new OutlineSync(config, { verbose: config.verbose })
  await sync.push(Boolean(options.force))
})

// ── verify ─────────────────────────────────────────────────────────────────

addSharedOptions(
  program
    .command("verify")
    .description("Validate configuration and custom path resolution"),
).action(async (options: GlobalOptions) => {
  const config = await resolveConfig(options)
  const sync = new OutlineSync(config, { verbose: config.verbose })
  await sync.verify()
})

// ── init ───────────────────────────────────────────────────────────────────

program
  .command("init")
  .description("Create a sample configuration file in the current directory")
  .action(async () => {
    await createSampleConfig()
  })

// ── Parse ──────────────────────────────────────────────────────────────────

program.parseAsync(process.argv)