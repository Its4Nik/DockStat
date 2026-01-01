# Outline Sync

Outline Sync is a small CLI for bidirectional synchronization between an Outline wiki and a local Markdown folder. It supports one‑time syncs, file watching, CI-friendly flows, and a targeted `push` command that compares timestamps before uploading changes.

## Features

- Sync Outline → Local (pull documents, write frontmatter)
- Sync Local → Outline (push local changes)
- `push` command that compares local vs remote `updatedAt` timestamps
- Prefers frontmatter `updatedAt` over file system `mtime`
- Collection filtering (include/exclude)
- Custom path mapping per document
- Preserves frontmatter metadata
- CI/CD friendly workflows
- File watching for real-time pushes
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

> [!CAUTION]
> This package's target is set to `bun` and a "bun banner" (#!/usr/bin/env bun) is also added during bundling. Make sure you have [bun](https://bun.sh) installed! (It's better than node anyways)

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

- `outline-sync init`  
  Create a sample `outline-sync.config.json` in the current directory.

- `outline-sync sync`  
  One-time sync: pulls documents from Outline and writes Markdown files (each with frontmatter including `updatedAt`).

- `outline-sync watch`  
  Watch the `outputDir` for local changes and push edits to Outline live.

- `outline-sync ci`  
  CI flow: perform a `syncDown` to cache remote `updatedAt` values then push local files that are newer.

- `outline-sync push`  
  Targeted push that compares each local file's timestamp against the remote `updatedAt` and uploads only those that appear newer. Does not require a prior `syncDown`.

## How change detection works

When determining if a local file should be pushed, the priority is:

1. frontmatter `updatedAt` (if present)
2. file system `mtime`

That local timestamp is compared against the remote document's `updatedAt`. If the local timestamp is later, the file is pushed.

Notes:
- `push` fetches remote `updatedAt` per-document (useful for CI when no `syncDown` was done).
- `ci` will `syncDown` first to build a cache and reduce API calls during comparison.
- Files without a valid frontmatter `id` are skipped for push and surfaced to the user.

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

Sync all collections (uses config/env or CLI args):

```bash
outline-sync sync
```

Watch and auto-push local edits (filter by collection):

```bash
outline-sync watch --include "Engineering"
```

CI job (pull then push local changes that are newer than remote):

```bash
outline-sync ci --exclude "Private,Draft"
```

Push local changes without an initial sync:

```bash
outline-sync push --url https://my.outline.app --token <YOUR_TOKEN> --output ./outline-docs
```

## CI/CD (GitHub Actions) example

A minimal workflow:
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

## Safety notes & best practices

- Ensure frontmatter `id` is present if you want files to be considered for push.
- `push` will perform API calls per-file to fetch remote metadata; be mindful of rate limits in CI.
- If a remote fetch fails (deleted doc, permissions), that file is surfaced for manual inspection.
- Prefer scheduled `sync` runs and targeted `push` runs in CI to reduce unnecessary API calls.

## Troubleshooting

- Unexpected pushes: inspect file frontmatter `updatedAt` and file `mtime`.
- Permission errors: verify the API token has document update scopes.
- Missing IDs: if you migrated files manually, ensure `id` is present in frontmatter for push support.

## Notes on collisions (collection vs document name)

If a collection and a top-level document share a sanitized title, files will be written so they do not create duplicate nested folders. For example, a root document named `DockStat` inside collection `DockStat` will be written as `./dockstat/README.md` (no extra nested folder). Custom paths configured in `customPaths` are preserved.

## Contributing

Contributions, bug reports and PRs are welcome. Please open issues in the main repo and target the `dev` branch for changes related to this package.

## License

This package follows the repository license. See the top-level LICENSE file for details.
