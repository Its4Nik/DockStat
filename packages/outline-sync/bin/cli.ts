#!/usr/bin/env bun

import { resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTopConfig, saveTopConfig } from "../lib/config";
import { listCollectionsPrompt, bootstrapCollection } from "../lib/init";
import { runSync } from "../lib/syncEngine";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function printHelpAndExit() {
  console.log(`
Usage:
  OUTLINE_API_KEY=... bun run bin/cli.ts [command] [--collection-id=ID] [--dry-run]

Commands:
  setup                    - interactive setup: list collections, choose one, create configs & pages.json
  list-collections         - print collections
  init --collection-id=ID  - bootstrap pages.json + markdown from collection (non-interactive)
  pull --collection-id=ID  - pull remote changes into local files
  push --collection-id=ID  - push local changes to remote
  sync --collection-id=ID  - do bidirectional sync (uses timestamps)
  --dry-run                - log actions, don't write
  --help, -h
`);
  process.exit(0);
}

const argv = process.argv.slice(2);
const cmd = argv[0] || "sync";
const flags = Object.fromEntries(
  argv
    .slice(1)
    .map((a) => {
      if (a.startsWith("--")) {
        const [k, v] = a.replace(/^--/, "").split("=");
        return [k, v ?? "true"];
      }
      return [a, "true"];
    })
    .filter(Boolean),
);

const DRY_RUN = Boolean(flags["dry-run"]);
const CLI_COLLECTION_OVERRIDE = flags["collection-id"] || null;

// set env from flags if provided
if (flags["api-key"]) process.env.OUTLINE_API_KEY = flags["api-key"];
if (flags["base-url"]) process.env.OUTLINE_BASE_URL = flags["base-url"];

if (flags.help || flags.h) {
  await printHelpAndExit();
}

try {
  const topConfig = await loadTopConfig();
  if (cmd === "list-collections") {
    await listCollectionsPrompt({ dryRun: DRY_RUN, nonInteractive: false });
    process.exit(0);
  } else if (cmd === "setup") {
    // interactive: let user choose
    await listCollectionsPrompt({ dryRun: DRY_RUN, nonInteractive: false });
    process.exit(0);
  } else if (cmd === "init") {
    const collectionId =
      CLI_COLLECTION_OVERRIDE || topConfig?.collections?.[0]?.id;
    if (!collectionId)
      throw new Error("Provide --collection-id or run setup first");
    await bootstrapCollection({ collectionId, dryRun: DRY_RUN });
    process.exit(0);
  } else if (cmd === "pull" || cmd === "push" || cmd === "sync") {
    const collectionId =
      CLI_COLLECTION_OVERRIDE || topConfig?.collections?.[0]?.id;
    if (!collectionId)
      throw new Error("Provide --collection-id or run setup first");
    await runSync({ collectionId, mode: cmd as any, dryRun: DRY_RUN });
    process.exit(0);
  } else {
    console.error("Unknown command:", cmd);
    await printHelpAndExit();
  }
} catch (err: any) {
  console.error("ERROR:", err?.message || err);
  process.exit(1);
}
