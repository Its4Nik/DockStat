# Outline Sync v2

Bidirectional synchronization between an [Outline](https://www.getoutline.com/) wiki and a local Markdown folder. Supports one-time syncs, file watching, CI-friendly flows, and a targeted `push` command that compares timestamps before uploading changes.

## What's new in v2

- **Robust CI mode** — No more crashes on first error. Documents that fail to push are reported individually while the sync continues.
- **Remote verification before push** — Before updating a document, `syncUp` checks that the document actually exists on Outline, preventing the `400 Bad Request` errors that occurred with stale or invalid IDs.
- **Error response parsing** — The API client now reads and surfaces the actual error message from Outline's JSON response body instead of just showing "400 Bad Request".
- **Retry logic** — Transient failures (429 rate-limits, 5xx server errors) are automatically retried with exponential backoff.
- **Dry-run mode** — Every command supports `--dry-run` to preview what would happen without making changes.
- **Improved UI/UX** — Colored output, progress bars, spinners, and clean aligned tables replace the old `console.table` output.
- **Smarter CI change detection** — Files not in the sync cache are checked against the remote before being marked as "changed", eliminating false positives.
- **Optimized syncDown** — Skips re-fetching documents that are already up-to-date locally, reducing API calls.

## Features

- Sync Outline → Local (pull documents with frontmatter metadata)
- Sync Local → Outline (push local changes)
- `push` command that compares local vs remote `updatedAt` timestamps
- Prefers frontmatter `updatedAt` over file system `mtime`
- Collection filtering (include/exclude)
- Custom path mapping per document
- Preserves frontmatter metadata
- CI/CD friendly workflows with error recovery
- File watching for real-time pushes
- Dry-run mode for safe previewing
- Safety checks for missing IDs or remote fetch errors

## Quick install

Using bun (preferred):
```bash
bun install -g @dockstat/outline-sync
```

Or via npm:
```bash
npm install -g @dockstat/outline-sync
```

> **Note:** This package targets `bun` and includes a `#!/usr/bin/env bun` shebang. Make sure you have [bun](https://bun.sh) installed.

## Getting started

1. Initialize a sample config in your repo:

```bash
outline-sync init
```

2. Edit the generated `outline-sync.config.json` (see configuration below).

3. Run a sync:

```bash
outline-sync sync
```

## Configuration

Configuration can come from a file, environment variables, or CLI flags. Precedence: CLI args → env vars → config file.

Example `outline-sync.config.json`:
```json
{
  "url": "https://your-outline.com",
  "token": "your_api_token",
  "outputDir": "./outline-docs",
  "includeCollections": ["Engineering", "Product"],
  "excludeCollections": ["Archive", "Private"],
  "customPaths": {
    "doc-id-abc123": "../../README.md",
    "doc-id-xyz789": "custom/important-doc.md"
  }
}
```

Environment variables:
```bash
export OUTLINE_URL="https://your-outline.com"
export OUTLINE_TOKEN="your_api_token"
export OUTLINE_OUTPUT_DIR="./outline-docs"
```

CLI examples (flags take precedence):

```bash
outline-sync sync --url https://your-outline.com --token $TOKEN --output ./outline-docs
```

## Commands

### `outline-sync init`
Create a sample `outline-sync.config.json` in the current directory.

### `outline-sync sync`
One-time sync: pulls documents from Outline and writes Markdown files with frontmatter including `updatedAt`.

### `outline-sync watch`
Watch the `outputDir` for local changes and push edits to Outline in real time.

### `outline-sync ci`
CI flow: performs a `syncDown` to build a cache, then detects local files that are newer than remote and pushes them. Key improvements in v2:
- Files not in the cache are verified against the remote API before being marked as "changed"
- Individual push errors don't crash the entire process
- A detailed summary with error reporting is shown at the end

### `outline-sync push`
Targeted push that compares each local file's timestamp against the remote `updatedAt` and uploads only those that appear newer. Does not require a prior `syncDown`.

### `outline-sync push --force`
Force push all local files that have a frontmatter ID, ignoring timestamp comparisons.

### `outline-sync verify`
Validate your configuration, custom path resolution, and check document existence on Outline.

## Global options

All commands support:

| Option | Description |
|--------|-------------|
| `-u, --url <url>` | Outline instance URL |
| `-t, --token <token>` | Outline API token |
| `-o, --output <dir>` | Output directory |
| `-c, --config <path>` | Config file path |
| `-i, --include <cols>` | Comma-separated collections to include |
| `-e, --exclude <cols>` | Comma-separated collections to exclude |
| `-v, --verbose` | Enable debug/trace logging |
| `--dry-run` | Preview changes without making them |

## How change detection works

When determining if a local file should be pushed, the priority is:

1. **frontmatter `updatedAt`** (if present and parseable)
2. **file system `mtime`** (fallback)

That local timestamp is compared against the remote document's `updatedAt`. If the local timestamp is later, the file is pushed.

Notes:
- `push` fetches remote `updatedAt` per-document (useful when no `syncDown` was done).
- `ci` will `syncDown` first to build a cache, then additionally verifies uncached files against remote before pushing.
- Files without a valid frontmatter `id` are skipped for push and surfaced to the user.
- Documents that no longer exist on Outline are reported as "Not Found" instead of causing a crash.

## Frontmatter format

Synced files include frontmatter like:

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

If you manually update the frontmatter `updatedAt` to a newer timestamp, the tool will honor it during comparisons.

## Example usage

Sync all collections:
```bash
outline-sync sync
```

Preview what would be synced without making changes:
```bash
outline-sync sync --dry-run
```

Watch and auto-push local edits (filter by collection):
```bash
outline-sync watch --include "Engineering"
```

CI job (pull then push local changes that are newer than remote):
```bash
outline-sync ci --exclude "Private,Draft"
```

Dry-run CI to see what would be pushed:
```bash
outline-sync ci --dry-run
```

Push local changes without an initial sync:
```bash
outline-sync push --url https://my.outline.app --token <YOUR_TOKEN> --output ./outline-docs
```

## CI/CD (GitHub Actions) example

```yaml
name: Outline Sync

on:
  push:
    branches: [main]
  schedule:
    - cron: "0 */6 * * *"

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

## Bug fixes from v1

### 400 Bad Request on document update
**Root cause:** The v1 code sent `documents.update` requests with document IDs without first verifying the document still existed on Outline. When a document had been deleted or the ID was stale, Outline returned a 400 error that crashed the entire CI process.

**Fix:** v2 calls `documentExists(id)` before attempting an update. If the document is not found, it's reported as "Not Found" instead of crashing. The API client also now reads and surfaces the actual error message from Outline's response body.

### CI mode treating all uncached files as "changed"
**Root cause:** After `syncDown`, the in-memory cache only contained documents that were actively synced. Files that existed locally but weren't in the cache were blindly pushed as "New", even if they were actually up-to-date.

**Fix:** v2's CI mode checks uncached files against the remote API before marking them as changed. This eliminates false-positive pushes.

### No error recovery
**Root cause:** v1 used `await` in a loop with no try/catch, so a single failed push would throw an unhandled error and terminate the process.

**Fix:** v2 wraps each push in error handling and accumulates results. The CI process continues even when individual files fail, and all errors are reported in the summary.

## Safety notes & best practices

- Ensure frontmatter `id` is present if you want files to be considered for push.
- `push` performs API calls per-file to fetch remote metadata; be mindful of rate limits in CI.
- If a remote fetch fails (deleted doc, permissions), that file is reported for manual inspection.
- Use `--dry-run` to preview changes before committing.
- Prefer scheduled `sync` runs and targeted `push` runs in CI to reduce unnecessary API calls.

## Troubleshooting

- **Unexpected pushes:** Inspect file frontmatter `updatedAt` and file `mtime`.
- **Permission errors:** Verify the API token has document update scopes.
- **Missing IDs:** If you migrated files manually, ensure `id` is present in frontmatter for push support.
- **400 errors:** Check that the document still exists on Outline. v2 will surface the actual error message from the API.
- **Rate limiting:** v2 automatically retries on 429 responses with exponential backoff.

## Notes on collisions (collection vs document name)

If a collection and a top-level document share a sanitized title, files will be written so they do not create duplicate nested folders. For example, a root document named `DockStat` inside collection `DockStat` will be written as `./dockstat/README.md` (no extra nested folder). Custom paths configured in `customPaths` are preserved.

## Contributing

Contributions, bug reports and PRs are welcome. Please open issues in the main repo and target the `dev` branch for changes related to this package.

## License

This package follows the repository license. See the top-level LICENSE file for details.
