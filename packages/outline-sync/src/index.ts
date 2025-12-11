#!/usr/bin/env bun
import { Command } from "commander"
import { OutlineSync } from "./sync"
import type { OutlineConfig } from "./types"

const program = new Command()

program.name("outline-sync").description("Sync Outline wiki to local folder").version("1.0.0")

program
  .command("sync")
  .description("One-time sync from Outline to local")
  .option("-u, --url <url>", "Outline URL", process.env.OUTLINE_URL)
  .option("-t, --token <token>", "API token", process.env.OUTLINE_TOKEN)
  .option("-o, --output <dir>", "Output directory", "./outline-docs")
  .action(async (options) => {
    if (!options.url || !options.token) {
      console.error("Error: OUTLINE_URL and OUTLINE_TOKEN must be provided")
      process.exit(1)
    }

    const config: OutlineConfig = {
      url: options.url,
      token: options.token,
      outputDir: options.output,
    }

    const sync = new OutlineSync(config)
    await sync.syncDown()
  })

program
  .command("watch")
  .description("Watch for local changes and sync bidirectionally")
  .option("-u, --url <url>", "Outline URL", process.env.OUTLINE_URL)
  .option("-t, --token <token>", "API token", process.env.OUTLINE_TOKEN)
  .option("-o, --output <dir>", "Output directory", "./outline-docs")
  .action(async (options) => {
    if (!options.url || !options.token) {
      console.error("Error: OUTLINE_URL and OUTLINE_TOKEN must be provided")
      process.exit(1)
    }

    const config: OutlineConfig = {
      url: options.url,
      token: options.token,
      outputDir: options.output,
    }

    const sync = new OutlineSync(config)
    await sync.watch()
  })

program
  .command("ci")
  .description("CI/CD mode: sync both ways")
  .option("-u, --url <url>", "Outline URL", process.env.OUTLINE_URL)
  .option("-t, --token <token>", "API token", process.env.OUTLINE_TOKEN)
  .option("-o, --output <dir>", "Output directory", "./outline-docs")
  .action(async (options) => {
    if (!options.url || !options.token) {
      console.error("Error: OUTLINE_URL and OUTLINE_TOKEN must be provided")
      process.exit(1)
    }

    const config: OutlineConfig = {
      url: options.url,
      token: options.token,
      outputDir: options.output,
    }

    const sync = new OutlineSync(config)
    await sync.ciSync()
  })

program.parse()
