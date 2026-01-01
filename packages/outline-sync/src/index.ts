import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { Command } from "commander"
import { OutlineSync } from "./sync"
import type { OutlineConfig } from "./types"
import fs from "node:fs"
import path from "node:path"

const program = new Command()

/**
 * Config discovery + loading:
 * - If OUTLINE_CONFIG env var is set and points at a readable file, use that.
 * - If a CLI `--config` path is provided and readable, use that.
 * - Walk up parent directories from startDir / cwd looking for common config filenames.
 * - Support package.json -> `outline` key.
 * - Support .js/.cjs config files (require) and JSON/YAML.
 */
const CONFIG_FILENAMES = [
  "outline-sync.config.json",
  "outline-sync.config.yaml",
  "outline-sync.config.yml",
  "outline-sync.config.js",
  "outline-sync.config.cjs",
  "outline-sync.config",
  ".outlinerc",
  "package.json",
]

async function findConfigPath(configPath?: string, startDir?: string): Promise<string | null> {
  const cwd = process.cwd()

  // 1) Env override
  if (process.env.OUTLINE_CONFIG) {
    const candidate = path.isAbsolute(process.env.OUTLINE_CONFIG)
      ? process.env.OUTLINE_CONFIG
      : path.resolve(cwd, process.env.OUTLINE_CONFIG)
    try {
      await fs.promises.access(candidate, fs.constants.R_OK)
      return candidate
    } catch {
      // fallthrough to search
    }
  }

  // 2) If explicit configPath provided, try it first
  if (configPath) {
    const resolved = path.isAbsolute(configPath) ? configPath : path.resolve(cwd, configPath)
    try {
      await fs.promises.access(resolved, fs.constants.R_OK)
      return resolved
    } catch {
      // fallthrough to search
    }
  }

  // 3) Walk up from startDir (or cwd)
  let dir = resolve(startDir || cwd)
  while (true) {
    for (const name of CONFIG_FILENAMES) {
      const candidate = join(dir, name)
      try {
        await fs.promises.access(candidate, fs.constants.R_OK)
        return candidate
      } catch {
        // not found, continue
      }
    }

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return null
}

async function loadConfigFilePath(configPath?: string): Promise<Partial<OutlineConfig>> {
  if (!configPath) return {}
  const ext = path.extname(configPath).toLowerCase()
  const base = path.basename(configPath).toLowerCase()

  try {
    if (ext === ".js" || ext === ".cjs") {
      try {
        delete require.cache[require.resolve(configPath)]
      } catch {}
      const mod = require(configPath)
      const cfg = mod.__esModule && mod.default ? mod.default : mod
      return (cfg as Partial<OutlineConfig>) || {}
    }

    const raw = await readFile(configPath, "utf-8")

    if (base === "package.json") {
      const parsed = JSON.parse(raw)
      return (parsed.outline || parsed) as Partial<OutlineConfig>
    }

    if (ext === ".json" || ext === ".config" || ext === ".outlinerc") {
      try {
        return JSON.parse(raw) as Partial<OutlineConfig>
      } catch {
        // fallthrough
      }
    }

    // Last-resort: try JSON parse, otherwise return empty object
    try {
      return JSON.parse(raw) as Partial<OutlineConfig>
    } catch {
      return {}
    }
  } catch {
    // If file is not readable or parse fails, return empty so we can fallback to env/CLI
    return {}
  }
}

async function loadConfig(configPath?: string, startDir?: string): Promise<Partial<OutlineConfig>> {
  // If explicit path exists, use it
  if (configPath) {
    const resolved = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(process.cwd(), configPath)
    try {
      await fs.promises.access(resolved, fs.constants.R_OK)
      return loadConfigFilePath(resolved)
    } catch {
      // fall through to search
    }
  }

  const discovered = await findConfigPath(configPath, startDir)
  if (!discovered) return {}
  return loadConfigFilePath(discovered)
}

function parseArrayOption(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

async function getConfig(
  options: {
    url?: string
    include?: string
    exclude?: string
    token?: string
    output?: string
    config?: string
    verbose?: boolean
  },
  loadConfigFile = true
): Promise<OutlineConfig> {
  const fileConfig = loadConfigFile ? await loadConfig(options.config) : {}

  const config: OutlineConfig = {
    url: options.url || fileConfig.url || process.env.OUTLINE_URL || "",
    token: options.token || fileConfig.token || process.env.OUTLINE_TOKEN || "",
    outputDir:
      options.output || fileConfig.outputDir || process.env.OUTLINE_OUTPUT_DIR || "./outline-docs",
    customPaths: (fileConfig && (fileConfig.customPaths || {})) || {},
    includeCollections: options.include
      ? parseArrayOption(options.include)
      : (fileConfig && (fileConfig.includeCollections as string[])) || undefined,
    excludeCollections: options.exclude
      ? parseArrayOption(options.exclude)
      : (fileConfig && (fileConfig.excludeCollections as string[])) || undefined,
    verbose: Boolean(options.verbose || fileConfig.verbose),
  }

  if (!config.url || !config.token) {
    console.error("Error: OUTLINE_URL and OUTLINE_TOKEN must be provided")
    console.error("Set via:")
    console.error("  - Environment variables (OUTLINE_URL, OUTLINE_TOKEN)")
    console.error("  - CLI arguments (--url, --token)")
    console.error("  - Config file (outline-sync.config.json or other supported config)")
    process.exit(1)
  }

  return config
}

program.name("outline-sync").description("Sync Outline wiki to local folder").version("1.0.0")

program
  .command("sync")
  .description("One-time sync from Outline to local")
  .option("-u, --url <url>", "Outline URL")
  .option("-t, --token <token>", "API token")
  .option("-o, --output <dir>", "Output directory")
  .option("-c, --config <path>", "Config file path")
  .option("-i, --include <collections>", "Comma-separated list of collections to include")
  .option("-e, --exclude <collections>", "Comma-separated list of collections to exclude")
  .option("-v, --verbose", "Enable debug logging")
  .action(async (options) => {
    const config = await getConfig(options)
    const sync = new OutlineSync(config, { verbose: config.verbose })
    await sync.syncDown()
  })

program
  .command("watch")
  .description("Watch for local changes and sync bidirectionally")
  .option("-u, --url <url>", "Outline URL")
  .option("-t, --token <token>", "API token")
  .option("-o, --output <dir>", "Output directory")
  .option("-c, --config <path>", "Config file path")
  .option("-i, --include <collections>", "Comma-separated list of collections to include")
  .option("-e, --exclude <collections>", "Comma-separated list of collections to exclude")
  .option("-v, --verbose", "Enable debug logging")
  .action(async (options) => {
    const config = await getConfig(options)
    const sync = new OutlineSync(config, { verbose: config.verbose })
    await sync.watch()
  })

program
  .command("ci")
  .description("CI/CD mode: sync both ways")
  .option("-u, --url <url>", "Outline URL")
  .option("-t, --token <token>", "API token")
  .option("-o, --output <dir>", "Output directory")
  .option("-c, --config <path>", "Config file path")
  .option("-i, --include <collections>", "Comma-separated list of collections to include")
  .option("-e, --exclude <collections>", "Comma-separated list of collections to exclude")
  .option("-v, --verbose", "Enable debug logging")
  .action(async (options) => {
    const config = await getConfig(options)
    const sync = new OutlineSync(config, { verbose: config.verbose })
    await sync.ciSync()
  })

program
  .command("push")
  .description("Push local changes to Outline")
  .option("-u, --url <url>", "Outline URL")
  .option("-t, --token <token>", "API token")
  .option("-o, --output <dir>", "Output directory")
  .option("-c, --config <path>", "Config file path")
  .option("-i, --include <collections>", "Comma-separated list of collections to include")
  .option("-e, --exclude <collections>", "Comma-separated list of collections to exclude")
  .option("-v, --verbose", "Enable debug logging")
  .option("-f, --force", "Force push (push all local files with IDs, ignoring remote timestamps)")
  .action(async (options) => {
    const config = await getConfig(options)
    const sync = new OutlineSync(config, { verbose: config.verbose })
    await sync.push(Boolean(options.force))
  })

program
  .command("verify")
  .description("Validate configuration and custom path resolution")
  .option("-c, --config <path>", "Config file path")
  .option("-t, --token <token>", "API token")
  .option("-v, --verbose", "Enable debug logging")
  .action(async (options) => {
    const config = await getConfig(options)
    const sync = new OutlineSync(config, { verbose: config.verbose })
    await sync.verify()
  })

program
  .command("init")
  .description("Create a sample configuration file")
  .action(async () => {
    const configPath = join(process.cwd(), "outline-sync.config.json")

    if (existsSync(configPath)) {
      console.error("❌ outline-sync.config.json already exists")
      process.exit(1)
    }

    const sampleConfig = {
      url: "https://your-outline.com",
      token: "your_api_token",
      outputDir: "./outline-docs",
      includeCollections: ["Engineering", "Product"],
      excludeCollections: [],
      customPaths: {
        "example-doc-id": "../../README.md",
        "another-doc-id": "custom/path/document.md",
      },
    }

    await writeFile(configPath, JSON.stringify(sampleConfig, null, 2), "utf-8")
    console.log("✅ Created outline-sync.config.json")
  })

program.parseAsync(process.argv)
