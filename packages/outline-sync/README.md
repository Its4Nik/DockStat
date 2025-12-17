# Outline Sync

Bidirectional sync for Outline wiki to local folders with CI/CD support.

## Installation

```bash
bun install -g @dockstat/outline-sync
```

## Features
<<<<<<< HEAD

- ✅ Sync Outline → Local
- ✅ Sync Local → Outline
- ✅ Push local changes to Outline (new `push` command)
- ✅ Compare modification dates (mtime) and frontmatter `updatedAt` to detect changes
- ✅ Custom path mapping for specific documents
- ✅ Collection filtering (include/exclude)
- ✅ Frontmatter metadata preservation
- ✅ CI/CD integration
- ✅ File watching

## What's new

Three main improvements were added:

1. Push command
   - `outline-sync push` lets you push local changes up to Outline without performing a full `sync`/`syncDown` first.
   - It compares local file timestamps against the remote document `updatedAt` and only pushes files that appear newer locally.

2. Modification-date comparison
   - When detecting local changes, the tool now prefers a frontmatter `updatedAt` timestamp (if present) and falls back to the file system modification time (`mtime`).
   - This allows more accurate determination of whether a local edit should be pushed.

3. Duplicate-folder fix (collection/document name collision)
   - Fixed an issue where a collection and a top-level document shared the same title (for example: collection "DockStat" and a root document titled "DockStat") and the sync created a nested duplicate folder like `./dockstat/dockstat/README.md`.
   - Now, when a root document's sanitized title equals the collection folder name, the file is written as `./<collection>/README.md` (no extra nested folder). This produces a single `./dockstat/README.md` for the example above and avoids confusing directory nesting.
   - This behavior preserves existing custom paths while preventing accidental duplicate folders when collection and document titles collide.

## Configuration

Create `outline-sync.config.json` (recommended):
=======

- ✅ Sync Outline → Local
- ✅ Sync Local → Outline
- ✅ Each doc in own folder with README.md
- ✅ Custom path mapping for specific documents
- ✅ Collection filtering (include/exclude)
- ✅ Frontmatter metadata preservation
- ✅ CI/CD integration
- ✅ File watching

## Configuration

### Option 1: Config File (Recommended)

Create `outline-sync.config.json`:

```bash
outline-sync init
```

Then edit the generated file:
>>>>>>> fc102f80d85485391e48e88e7431dd52b58e3cc7

```json
{
  "url": "https://your-outline.com",
  "token": "your_api_token",
  "outputDir": "./outline-docs",
  "includeCollections": ["Engineering", "Product"],
<<<<<<< HEAD
  "excludeCollections": [],
  "customPaths": {
    "example-doc-id": "../../README.md",
    "another-doc-id": "custom/path/document.md"
=======
  "excludeCollections": ["Archive", "Private"],
  "customPaths": {
    "doc-id-abc123": "../../README.md",
    "doc-id-xyz789": "custom/important-doc.md"
>>>>>>> fc102f80d85485391e48e88e7431dd52b58e3cc7
  }
}
```

You can also use environment variables:

```bash
export OUTLINE_URL=https://your-outline.com
export OUTLINE_TOKEN=your_api_token
export OUTLINE_OUTPUT_DIR=./outline-docs
```

Or pass options via CLI (these take precedence over env/config file).

## Usage

### Commands

- `outline-sync init`  
  Create a sample `outline-sync.config.json` in the current directory.

- `outline-sync sync`  
  One-time sync from Outline → local. Pulls documents and writes frontmatter (including `updatedAt`) into each `README.md`.

- `outline-sync watch`  
  Watches your `outputDir` for local changes and pushes them to Outline as they happen (bidirectional).

- `outline-sync ci`  
  CI/CD friendly flow: performs a `syncDown` (pulls remote docs and caches their `updatedAt`), finds local files newer than the cached remote timestamps, and pushes those changes.

- `outline-sync push` (new)  
  Push local changes to Outline by comparing each local file against the actual remote document `updatedAt`. This does NOT perform an initial `syncDown`. For each local markdown file:
    - The tool reads frontmatter for an `id` (document ID). If missing, the file is skipped.
    - It prefers frontmatter `updatedAt` (if present) when comparing timestamps.
    - Otherwise it falls back to the file system `mtime`.
    - It fetches the remote document's `updatedAt` (if not already cached) and compares.
    - If the local timestamp is later than remote `updatedAt`, the file is pushed.
    - If the remote document cannot be fetched (deleted/permission issues), the file is included in the push list so you can inspect it.

### Examples

Sync all collections (uses config/env or CLI args for credentials if required):
```bash
outline-sync sync
```

Watch and auto-push local edits:
```bash
outline-sync watch --include "Engineering"
```

CI job (pull then push any local changes that are newer than remote):
```bash
outline-sync ci --exclude "Private,Draft"
```

Push local changes (no initial sync; queries remote per-file):
```bash
outline-sync push
```

Push while specifying config/credentials inline:
```bash
outline-sync push --url https://my.outline.app --token <YOUR_TOKEN> --output ./outline-docs
```

## How change detection works

When deciding whether a local file should be pushed upward, the tool uses this priority:

1. frontmatter `updatedAt` (if present in the markdown file's frontmatter)
2. file system `mtime` (the file's modification time on disk)

That local timestamp is compared against the remote document's `updatedAt`. If the local timestamp is newer, the file is scheduled to be pushed.

Notes:
- `outline-sync ci` will populate an internal cache of remote `updatedAt` values during the initial `syncDown` and use that to avoid fetching each remote doc again.
- `outline-sync push` will fetch remote `updatedAt` per-document as it evaluates each file (useful for CI runs where you didn't perform a `syncDown` first).
- Frontmatter must contain a valid `id` (document ID) for a file to be considered for push. If `id` is missing the file will be skipped.

## Frontmatter format

Each synced file includes frontmatter with metadata similar to:

```yaml
---
id: doc-id-123
title: My Document
collectionId: col-456
parentDocumentId: null
updatedAt: 2025-01-01T12:34:56.000Z
urlId: my-document-urlid
---
```

The `updatedAt` field is written by `sync` when pulling from Outline. If you edit a file and update the frontmatter `updatedAt` manually to a newer timestamp, the tool will honor that value when deciding to push.

## Safety notes & best practices

- Always ensure your frontmatter `id` is present if you expect a file to be pushed back to Outline.
- When using `push` in CI, be aware it will fetch remote metadata for every document being considered; this will incur API calls.
- If a file cannot be matched to a remote document (missing id or fetch error), it will be surfaced so you can investigate before pushing.

## CI/CD example (GitHub Actions)

```yaml
name: Outline Sync

on:
  push:
    branches: [main]
  schedule:
<<<<<<< HEAD
    - cron: "0 */6 * * *"
=======
    - cron: "0 */6 * * *" # Every 6 hours
>>>>>>> fc102f80d85485391e48e88e7431dd52b58e3cc7

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run ci
        env:
          OUTLINE_URL: ${{ secrets.OUTLINE_URL }}
          OUTLINE_TOKEN: ${{ secrets.OUTLINE_TOKEN }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "docs: sync from Outline"
```
<<<<<<< HEAD

## Troubleshooting

- If you see files being pushed unexpectedly, inspect their frontmatter `updatedAt` values and file `mtime`.
- If push fails due to permissions, confirm the API token has the required document update scope.
- For large repos, consider running `sync` in a scheduled job and using `push` only when necessary to reduce API calls.
=======
>>>>>>> fc102f80d85485391e48e88e7431dd52b58e3cc7
