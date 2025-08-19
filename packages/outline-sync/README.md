# outline-sync — `@dockstat/outline-sync`

Sync Outline (app.getoutline.com) collections ↔ Markdown in your repo.
Designed for multi-collection pipelines.
Features:

* Two-way sync (pull / push / timestamp-based sync)
* Multi-collection support (`--collection` repeatable)
* Folder-based default storage (each page → `<slug>/README.md`, children inherit folders)
* Per-collection mapping file for custom paths
* Config-driven: `configs/outline-sync.json`, `<collection>.config.json`, `<collection>.pages.json`
* Whitespace/newline-agnostic diffs (formatting-only changes are ignored)
* Uses Git commit time when available (falls back to fs mtime)
* Dry-run mode, backups of overwritten files

---

# Install

Using `bunx` (recommended):

```bash
bunx @dockstat/outline-sync <command> [flags]
```

> Security note: prefer `OUTLINE_API_KEY=...` in CI or environment. Passing `--api-key="..."` is supported but may expose the key in process lists or shell history.

---

# Quickstart (recommended)

1. Set your API key:

```bash
export OUTLINE_API_KEY="sk_..."   # recommended for local / CI usage
```

2. Interactive setup (lists collections and lets you register one):

```bash
bunx @dockstat/outline-sync setup
```

3. Bootstrap a collection (non-interactive):

```bash
bunx @dockstat/outline-sync init --collection="COLLECTION_UUID"
# or multiple:
bunx @dockstat/outline-sync init --collection="id1" --collection="id2"
```

This creates/updates:

* `configs/outline-sync.json` — top-level config listing collections
* `configs/<collection-id>.config.json` — per-collection mapping config
* `configs/<collection-id>.pages.json` — assembled manifest of pages (used by sync)
* `docs/...` — markdown files saved folder-based (`<slug>/README.md`)

4. Run a dry-run sync:

```bash
bunx @dockstat/outline-sync sync --collection="COLLECTION_UUID" --dry-run
```

5. Run an actual sync/push/pull:

```bash
bunx @dockstat/outline-sync sync --collection="COLLECTION_UUID"
bunx @dockstat/outline-sync pull --collection="COLLECTION_UUID"
bunx @dockstat/outline-sync push --collection="COLLECTION_UUID"
```

You can pass `--collection` multiple times to run against several collections in one invocation:

```bash
bunx @dockstat/outline-sync sync \
  --collection="id-one" --collection="id-two" \
  --dry-run
```

You can also pass `--api-key="sk_..."` or `--base-url="https://custom.outline"` on the CLI; these override environment variables.

---

# CLI reference

```
Usage:
  OUTLINE_API_KEY=... bunx @dockstat/outline-sync [command] [--collection=ID]... [--dry-run] [--api-key="..."]

Commands:
  setup                    - interactive setup (list & add a collection)
  list-collections         - print the collections visible to the API key
  init --collection=ID     - bootstrap pages.json + markdown for collection (repeatable)
  pull --collection=ID     - pull remote changes into local files (repeatable)
  push --collection=ID     - push local changes to remote (repeatable)
  sync --collection=ID     - bidirectional sync (timestamp-based) (repeatable)

Flags:
  --collection=ID          Repeatable; run command for multiple collection ids
  --dry-run                Preview actions (no writes to Outline or disk)
  --api-key="..."          Provide Outline API key (overrides env var)
  --base-url="..."         Custom Outline base URL (overrides default)
  --help, -h
```

---

# Config layout & examples

Project layout:

```
configs/
  outline-sync.json            # top-level config (collections list)
  <collection_id>.config.json  # mapping rules + saveDir for a collection
  <collection_id>.pages.json   # assembled pages manifest used by sync
docs/                           # markdown files (default saveDir)
```

## `configs/outline-sync.json` (top-level)

```json
{
  "collections": [
    {
      "id": "COLLECTION_UUID",
      "name": "Support Docs",
      "saveDir": "docs",
      "pagesFile": "configs/COLLECTION_UUID.pages.json",
      "configFile": "configs/COLLECTION_UUID.config.json"
    }
  ]
}
```

## `configs/<collection_id>.config.json` (mapping rules)

```json
{
  "collectionId": "COLLECTION_UUID",
  "saveDir": "docs",
  "mappings": [
    {
      "match": { "id": "doc-id-123" },
      "path": "guides/setup/"         // directory mapping → will place doc as guides/setup/README.md
    },
    {
      "match": { "title": "API Reference" },
      "path": "reference/README.md"    // explicit filename mapping
    }
  ]
}
```

Rules:

* Match by `id` (preferred) or `title` (exact match).
* `path` can be:

  * directory-like (`guides/setup/` or any path without `.md`) → page becomes `<path>/README.md` and children inherit that directory,
  * explicit file (`reference/README.md`) → used verbatim (relative to project root unless you give an absolute path),
  * bare filename → placed under parent directory or `saveDir`.

## `configs/<collection_id>.pages.json` (generated)

This is a manifest of pages used by the sync engine. Example:

```json
{
  "collectionId": "COLLECTION_UUID",
  "pages": [
    {
      "title": "Product",
      "file": "docs/product/README.md",
      "id": "doc-product-id",
      "children": [
        {
          "title": "Getting Started",
          "file": "docs/product/getting-started/README.md",
          "id": "doc-getting-started-id",
          "children": []
        }
      ]
    }
  ]
}
```

`pages.json` is updated when new remote documents are created (IDs get written back).

---

# How syncing & conflict resolution works

* The tool uses Git commit timestamp (if file is tracked) as the authoritative local timestamp. If Git info isn't available, it falls back to filesystem modification time.
* For `sync` (default bidirectional flow): the *newer* version wins (remote.updatedAt vs local timestamp). The tool **ignores whitespace/newline-only differences** when deciding whether content actually differs — if the only difference is formatting, no update is performed.
* For `pull`: remote always wins and overwrites the local file if content differs (ignoring whitespace).
* For `push`: local always wins; remote is updated if content differs (ignoring whitespace).
* When writing to existing local files, a backup is created: `path/to/file.md.outline-sync.bak.<timestamp>`.

---

# File layout style

Default behavior: folder-based.

For each page:

```
<saveDir>/<ancestor-slug>/<page-slug>/README.md
```

Example Outline structure:

* Product

  * Getting Started

    * Install

Results in:

```
docs/product/README.md
docs/product/getting-started/README.md
docs/product/getting-started/install/README.md
```

You can override per-page locations in the `<collection_id>.config.json` mappings (see above).

---

# Advanced notes

* **Multiple collections:** pass `--collection` multiple times to operate on multiple collections in order. If `--collection` is not provided, the tool will operate on all collections listed in `configs/outline-sync.json`.
* **API key sources:** first CLI `--api-key`, then `OUTLINE_API_KEY` env var. Passing `--api-key` sets `process.env.OUTLINE_API_KEY` early so imports read it properly.
* **Base URL:** `--base-url` for self-hosted/alternate Outline instances.
* **Dry-run:** always test with `--dry-run` before doing real `push`/`sync`.
* **Mappings precedence:** `id` match wins over `title` match; explicit mapping wins and children will inherit directories if mapping points to a directory.
* **Mapping templates:** not supported by default; you can use direct paths and directories via `path` in mapping rules.

---

# Troubleshooting

* "Manifest not found": run `init --collection=ID` or `setup` to create `configs/<collection_id>.pages.json`.
* API errors / auth: check `OUTLINE_API_KEY` (or pass `--api-key`) and `--base-url`. Ensure token has access to the collection.
* Permissions / writing files: make sure the process has write permissions for `docs/` and `configs/`.
* Large collections: the Outline API is paginated (the client already pages with limit=100). If you hit rate limits, re-run with fewer collections at a time or add retries in your CI.

---

# Contributing & development

Contributions welcome!

* Repo layout is modular (`bin/cli.ts`, `lib/*.ts`) — feel free to add features:

  * mapping templates (`{{slug}}`) or glob rules
  * parallel collection sync with a `--concurrent` flag
  * a `--api-key-file` option to read secrets from a file
  * richer conflict resolution (merge or interactive prompts)

When developing locally:

```bash
# run CLI against a local checkout
bun run bin/cli.ts setup
bun run bin/cli.ts init --collection="..."
```
