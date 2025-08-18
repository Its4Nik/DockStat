# Outline ↔ Git Markdown Sync (Bun CLI)

A small Bun-based CLI that bi-directionally syncs a Git-backed Markdown tree with a **single** Outline collection.

Features:

* Two-way sync (newer wins): push local (git) → Outline; pull Outline → local.
* Prefer **git commit timestamp** for local change detection (falls back to `mtime`).
* Single collection only (manifest top-level `collectionId` or CLI / env override).
* `--init` to bootstrap `pages.json` + `docs/` from an existing collection.
* `--list-collections` to print available collections (id + name).
* `--dry-run` to preview actions without writing.
* Safe local backups before overwriting (`*.outline-sync.bak.<ts>`).
* Bun + TypeScript single-file CLI (`sync.ts`) — drop in repo root and run with Bun.

---

## Table of contents

* # Quick start
* # Manifest (`pages.json`)
* # Commands / Flags
* # Init (bootstrap) flow
* # How sync decisions are made
* # CI integration example
* # Safety & backups
* # Troubleshooting
* # Extending / Roadmap
* # License

---

# Quick start

1. Install Bun: [https://bun.sh](https://bun.sh)
2. Place the provided `sync.ts` in your repository root.
3. Ensure you have a shell environment variable `OUTLINE_API_KEY` set to a valid Outline API key.

```bash
export OUTLINE_API_KEY="sk_live_..."   # REQUIRED
# optional:
export OUTLINE_BASE_URL="https://app.getoutline.com"
export OUTLINE_COLLECTION_ID="COLLECTION_UUID"  # optional runtime override
```

4. To bootstrap a manifest from an existing collection (recommended first run):

```bash
# list collections so you can pick the collection id
OUTLINE_API_KEY=sk_xxx bun run sync.ts --list-collections

# bootstrap files + pages.json from the collection
OUTLINE_API_KEY=sk_xxx bun run sync.ts --init --collection-id=COLLECTION_UUID
```

5. Review and commit `pages.json` and `docs/`:

```bash
git add pages.json docs
git commit -m "chore: bootstrap Outline manifest"
```

6. Run normal sync:

```bash
OUTLINE_API_KEY=sk_xxx bun run sync.ts
```

Or preview only (no writes):

```bash
OUTLINE_API_KEY=sk_xxx bun run sync.ts --dry-run
```

---

# Manifest (`pages.json`)

`pages.json` defines the single collection and the page tree. Example:

```json
{
  "collectionId": "YOUR_COLLECTION_UUID",
  "pages": [
    {
      "title": "Home",
      "file": "docs/home.md",
      "id": null,
      "children": [
        {
          "title": "Subpage",
          "file": "docs/subpage.md",
          "id": null,
          "children": []
        }
      ]
    },
    {
      "title": "About",
      "file": "docs/about.md",
      "id": null,
      "children": []
    }
  ]
}
```

Fields:

* `collectionId`: The single Outline collection the sync will write to. Required (or must be provided at runtime).
* `title`: Outline document title.
* `file`: Relative path to the markdown file.
* `id`: Outline document id (UUID). Use `null` for documents not yet created; `--init` will populate ids when bootstrapping.
* `children`: nested pages.

**Important:** Only the top-level `collectionId` (manifest) or a runtime override (`--collection-id` / `OUTLINE_COLLECTION_ID`) is used. Per-page collection fields are ignored.

---

# Commands / Flags

* `--init` : Bootstrap `pages.json` + `docs/` from an existing Outline collection. Requires `--collection-id` (or `OUTLINE_COLLECTION_ID` env var).
* `--list-collections` : Print all collections you can access (id + name).
* `--collection-id=<ID>` : Override manifest collection id for this run (useful in CI).
* `--dry-run` : Preview actions without writing to Outline or local files.
* `--help` / `-h` : Show help.

Examples:

```bash
# list collections
OUTLINE_API_KEY=sk_xxx bun run sync.ts --list-collections

# init from collection
OUTLINE_API_KEY=sk_xxx bun run sync.ts --init --collection-id=abc-uuid

# normal sync
OUTLINE_API_KEY=sk_xxx bun run sync.ts

# dry-run preview
OUTLINE_API_KEY=sk_xxx bun run sync.ts --dry-run
```

---

# Init (bootstrap) flow

`--init` performs:

1. `collections.list` or `documents.list` to fetch documents from the collection.
2. Creates `docs/<slug>.md` files for each document (slugified title). If slugs collide, a short id suffix is appended.
3. Builds the parent/child tree and writes `pages.json` with each entry containing the Outline `id`.
4. If not using `--dry-run`, files and `pages.json` are written to disk. Review and commit them.

This is the recommended first step when adopting the tool for an existing Outline collection.

---

# How sync decisions are made

For each manifest page:

1. If local file exists, determine local timestamp:

   * Prefer **git last commit timestamp** (`git log -1 --format=%ct -- <file>`).
   * If not available, use filesystem `mtime`.
2. If `page.id` exists, fetch Outline metadata (`documents.info`) and read `updatedAt`.
3. Compare timestamps (500ms tolerance):

   * `local > remote` → **push** local content to Outline (`documents.update`).
   * `remote > local` → **pull** remote content and overwrite local file (creates backup).
   * equal → **skip**.
4. If `page.id` is null → create doc in Outline (`documents.create`) under manifest collection and parent, then persist returned `id` into `pages.json`.

Note: Timestamp comparison uses git commit times where possible so that checkout/mtime changes don't cause accidental overrides.

---

# CI integration example

A typical CI step (safe):

```bash
# in CI, set OUTLINE_API_KEY as secret
bun run sync.ts --dry-run          # preview what would change
bun run sync.ts                    # perform sync
git add pages.json
git commit -m "chore: outline sync update" || true
# optionally push — guard against CI loops
```

Tip: Only commit when `pages.json` changed and be careful not to trigger infinite CI runs from the commit itself (e.g., detect CI and skip push).

---

# Safety & backups

* Before overwriting a local file, the script copies it to `file.outline-sync.bak.<timestamp>` (same directory).
* `--dry-run` mode prints actions without writing to Outline or disk.
* The tool writes `id`s back to `pages.json`; commit that file after `--init`.
* Basic retry/backoff is implemented for API rate-limits (429). For very large collections you may want to add stronger batching.

---

# Troubleshooting

* `ERROR: please set OUTLINE_API_KEY` — set `OUTLINE_API_KEY` env var.
* `Manifest pages.json not found` — run `--init --collection-id=<id>` to bootstrap.
* Duplicate pages after init: ensure you used the right collection; the tool does not attempt to dedupe across multiple collections.
* `git log` returns nothing for a file: file not committed; the script falls back to `mtime`.
* Hitting rate limits (429): rerun later or implement slower batching.

---

# License

[MPL 2.0](./LICENSE)
