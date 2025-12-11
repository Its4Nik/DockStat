#!/usr/bin/env bun
import { Command } from "commander"
import { OutlineSync } from "./sync"
import type { OutlineConfig } from "./types"
import { existsSync } from "fs"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"

const program = new Command()

async function loadConfig(configPath?: string): Promise<Partial<OutlineConfig>> {
  const defaultPath = join(process.cwd(), "outline-sync.config.json")
  const path = configPath || defaultPath

  if (existsSync(path)) {
    console.log(`📝 Loading config from ${path}`)
    const content = await readFile(path, "utf-8")
    return JSON.parse(content)
  }

  return {}
}

function parseArrayOption(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

async function getConfig(options: any, loadConfigFile = true): Promise<OutlineConfig> {
  const fileConfig = loadConfigFile ? await loadConfig(options.config) : {}

  const config: OutlineConfig = {
    url: options.url || fileConfig.url || process.env.OUTLINE_URL || "",
    token: options.token || fileConfig.token || process.env.OUTLINE_TOKEN || "",
    outputDir:
      options.output || fileConfig.outputDir || process.env.OUTLINE_OUTPUT_DIR || "./outline-docs",
    customPaths: fileConfig.customPaths || {},
    includeCollections: options.include
      ? parseArrayOption(options.include)
      : fileConfig.includeCollections,
    excludeCollections: options.exclude
      ? parseArrayOption(options.exclude)
      : fileConfig.excludeCollections,
  }

  if (!config.url || !config.token) {
    console.error("Error: OUTLINE_URL and OUTLINE_TOKEN must be provided")
    console.error("Set via:")
    console.error("  - Environment variables (OUTLINE_URL, OUTLINE_TOKEN)")
    console.error("  - CLI arguments (--url, --token)")
    console.error("  - Config file (outline-sync.config.json)")
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
  .action(async (options) => {
    const config = await getConfig(options)
    const sync = new OutlineSync(config)
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
  .action(async (options) => {
    const config = await getConfig(options)
    const sync = new OutlineSync(config)
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
  .action(async (options) => {
    const config = await getConfig(options)
    const sync = new OutlineSync(config)
    await sync.ciSync()
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
    console.log("\n📝 Edit the file and replace example values with your actual configuration")
  })

program.parse()
