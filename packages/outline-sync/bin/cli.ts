#!/usr/bin/env bun

/* bin/cli.ts
   - Parse CLI flags first (so --api-key is applied before modules import env)
   - Support repeatable --collection flags
   - Then dynamically import the rest of the app
*/

const rawArgs = process.argv.slice(2);

// parse flags (repeatable --collection)
const flags: Record<string, string | boolean | string[]> = {};
const positionals: string[] = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === "--help" || a === "-h") {
    positionals.push("--help");
  } else if (a.startsWith("--collection=") || a.startsWith("--collection:")) {
    const val = a.split(/[:=]/)[1] || "";
    if (!flags.collection) flags.collection = [];
    (flags.collection as string[]).push(val);
  } else if (a === "--collection") {
    // support `--collection <value>`
    const val = rawArgs[i + 1];
    if (val && !val.startsWith("--")) {
      if (!flags.collection) flags.collection = [];
      (flags.collection as string[]).push(val);
      i++; // consume next arg
    }
  } else if (a.startsWith("--")) {
    const [k, v] = a.replace(/^--/, "").split("=");
    flags[k] = v === undefined ? true : v;
  } else {
    positionals.push(a);
  }
}

// If user passed --api-key or --base-url, set them immediately so dynamic imports see them.
if (flags["api-key"]) {
  // do NOT log the key to avoid accidental leakage in logs
  process.env.OUTLINE_API_KEY = String(flags["api-key"]);
}
if (flags["base-url"]) {
  process.env.OUTLINE_BASE_URL = String(flags["base-url"]);
}

if (positionals.includes("--help") || flags.help || flags.h) {
  console.log(`
Usage:
  OUTLINE_API_KEY=... bun run bin/cli.ts [command] [--collection=ID]... [--dry-run] [--api-key="..."]

Commands:
  setup                    - interactive setup: list collections, choose one
  list-collections         - print collections
  init --collection=ID     - bootstrap pages.json + markdown (repeatable)
  pull --collection=ID     - pull remote changes (repeatable)
  push --collection=ID     - push local changes (repeatable)
  sync --collection=ID     - bidirectional sync (repeatable)

Flags:
  --collection=ID          Repeatable; run command against multiple collections
  --api-key="..."          Provide Outline API key (overrides env var)
  --base-url="..."         Provide Outline base URL (overrides env var)
  --dry-run                Preview only
  --help, -h
Examples:
  OUTLINE_API_KEY=... bunx @dockstat/outline-sync --collection="id1" --collection="id2" sync --dry-run
  bun run bin/cli.ts sync --api-key="sk_xxx" --collection="id1"
`);
  process.exit(0);
}

const { loadTopConfig } = await import("../lib/config");
const { listCollectionsPrompt, bootstrapCollection } = await import(
  "../lib/init"
);
const { runSync } = await import("../lib/syncEngine");

const cmd = positionals[0] || "sync";
const DRY_RUN = Boolean(flags["dry-run"]);
const collectionsFromCli = (flags.collection as string[] | undefined) ?? [];

try {
  const topConfig = (await loadTopConfig()) || { collections: [] };

  const resolveTargets = (): string[] => {
    if (collectionsFromCli.length > 0) return collectionsFromCli;
    if (topConfig.collections && topConfig.collections.length > 0) {
      return topConfig.collections.map((c) => c.id);
    }
    return [];
  };

  if (cmd === "list-collections") {
    await listCollectionsPrompt({ dryRun: DRY_RUN, nonInteractive: false });
    process.exit(0);
  }

  if (cmd === "setup") {
    await listCollectionsPrompt({ dryRun: DRY_RUN, nonInteractive: false });
    process.exit(0);
  }

  if (cmd === "init") {
    const targets = resolveTargets();
    if (!targets.length)
      throw new Error(
        "Init requires at least one collection. Provide --collection or run setup.",
      );
    for (const collectionId of targets) {
      console.log(
        `\n==> bootstrapping collection ${collectionId} (dryRun=${DRY_RUN})`,
      );
      await bootstrapCollection({ collectionId, dryRun: DRY_RUN });
    }
    process.exit(0);
  }

  if (cmd === "pull" || cmd === "push" || cmd === "sync") {
    const targets = resolveTargets();
    if (!targets.length)
      throw new Error(
        `Command "${cmd}" requires at least one collection id. Provide with --collection=ID or run setup.`,
      );
    const mode = cmd === "pull" ? "pull" : cmd === "push" ? "push" : "sync";
    for (const collectionId of targets) {
      console.log(`\n==> Running ${mode} for collection ${collectionId}`);
      await runSync({ collectionId, mode: mode as any, dryRun: DRY_RUN });
    }
    process.exit(0);
  }

  console.error("Unknown command:", cmd);
  process.exit(1);
} catch (err: any) {
  console.error("ERROR:", err?.message || err);
  process.exit(1);
}

export {};
