# Outline Sync

Bidirectional sync for Outline wiki to local folders with CI/CD support.

## Installation

```bash
bun install
bun run build
```

## Configuration

### Option 1: Config File (Recommended)

Create `outline-sync.config.json`:

```bash
outline-sync init
```

Then edit the generated file:

```json
{
  "url": "https://your-outline.com",
  "token": "your_api_token",
  "outputDir": "./outline-docs",
  "customPaths": {
    "doc-id-abc123": "../../README.md",
    "doc-id-xyz789": "custom/important-doc.md"
  }
}
```

**Custom Paths:**
- Document IDs can be found in the Outline URL or via the API
- Paths starting with `..` are relative to current working directory
- Other paths are relative to `outputDir`

**Finding Document IDs:**
1. Open document in Outline
2. Check URL: `https://outline.com/doc/my-document-abc123` (ID is `abc123`)
3. Or run initial sync and check frontmatter in generated files

### Option 2: Environment Variables

```bash
export OUTLINE_URL=https://your-outline.com
export OUTLINE_TOKEN=your_api_token
export OUTLINE_OUTPUT_DIR=./outline-docs
```

### Option 3: CLI Arguments

Pass configuration via command line (takes precedence over other methods).

## Usage

### Commands

**Initialize config file:**

```bash
outline-sync init
```

**One-time sync (down only):**

```bash
outline-sync sync
# or with config file
outline-sync sync --config custom-config.json
```

**Watch mode (bidirectional):**

```bash
outline-sync watch
```

**CI/CD mode:**

```bash
outline-sync ci
```

## API Reference (CLI Commands)

### `outline-sync init`

Creates a sample `outline-sync.config.json` configuration file in the current directory.

**Example:**
```bash
outline-sync init
```

### `outline-sync sync [options]`

Performs a one-time synchronization from your Outline wiki to your local folder. This command only pulls changes from Outline.

**Options:**

- `--url <url>`: The URL of your Outline instance. Can also be set via `OUTLINE_URL` env var or config file.
- `--token <token>`: Your Outline API token. Can also be set via `OUTLINE_TOKEN` env var or config file.
- `--output <dir>`: The local directory where documents will be stored. Default: `./outline-docs`
- `--config <path>`: Path to config file. Default: `./outline-sync.config.json`

**Example:**
```bash
outline-sync sync --url https://my.outline.app --token <YOUR_TOKEN> --output ~/my-wiki
```

### `outline-sync watch [options]`

Starts a persistent process that watches for changes in your local directory and syncs them to Outline, and also pulls new changes from Outline periodically. This enables bidirectional synchronization.

**Options:**

- `--url <url>`: The URL of your Outline instance.
- `--token <token>`: Your Outline API token.
- `--output <dir>`: The local directory being watched. Default: `./outline-docs`
- `--config <path>`: Path to config file. Default: `./outline-sync.config.json`

**Example:**
```bash
outline-sync watch
```

### `outline-sync ci [options]`

Executes a CI/CD-friendly synchronization. This command first pulls all documents from Outline, then checks for any local changes in your configured output directory, and finally pushes those local changes back to Outline. Designed for automated environments.

**Options:**

- `--url <url>`: The URL of your Outline instance.
- `--token <token>`: Your Outline API token.
- `--output <dir>`: The local directory to synchronize. Default: `./outline-docs`
- `--config <path>`: Path to config file. Default: `./outline-sync.config.json`

**Example:**
```bash
outline-sync ci --output ./project-docs
```

---

## Examples

### Example 1: Root README

Place a specific document as your project's main README:

```json
{
  "customPaths": {
    "doc-abc123": "../../README.md"
  }
}
```

### Example 2: Mixed Structure

Combine auto-organized docs with custom locations:

```json
{
  "outputDir": "./docs",
  "customPaths": {
    "doc-home": "../../README.md",
    "doc-api": "../../API.md",
    "doc-contrib": "../../CONTRIBUTING.md"
  }
}
```

Other documents without custom paths will be organized in `./docs` by collection.

### Example 3: Getting Document IDs

After first sync, check the frontmatter:

````markdown
---
id: abc123def456
title: My Document
collectionId: xyz789
parentDocumentId: null
updatedAt: '2024-01-15T10:30:00Z'
urlId: my-document-abc123
---

Document content here...
```

Use the `id` field in your `customPaths` configuration.

## Features

- ✅ Sync Outline → Local
- ✅ Sync Local → Outline
- ✅ Each doc in own folder with README.md
- ✅ Custom path mapping for specific documents
- ✅ Frontmatter metadata preservation
- ✅ CI/CD integration
- ✅ File watching

## CI/CD Integration

### GitHub Actions

```yaml
name: Outline Sync

on:
  push:
    branches: [main]
  schedule:
    - cron: "0 */6 * * *" # Every 6 hours

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

Store `outline-sync.config.json` in your repo (without sensitive tokens):

```json
{
  "outputDir": "./docs",
  "customPaths": {
    "doc-abc123": "../../README.md"
  }
}
```

Tokens can be passed via environment variables in CI.

## License

MIT
