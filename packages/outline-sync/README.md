# Outline Sync

Bidirectional sync for Outline wiki to local folders with CI/CD support.

## Installation

```bash
bun install -g @dockstat/outline-sync
```

## Features

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

**Collection Filtering:**
- `includeCollections`: Array of collection names or IDs to sync. If specified, only these collections are synced.
- `excludeCollections`: Array of collection names or IDs to exclude from sync. Applies when `includeCollections` is not set.
- Collections can be matched by name (case-insensitive) or by ID
- If both are specified, `includeCollections` takes precedence

**Custom Paths:**
- Document IDs can be found in the Outline URL or via the API
- Paths starting with `..` are relative to current working directory
- Other paths are relative to `outputDir`

**Finding Collection Names:**
1. Look at your Outline sidebar for collection names
2. Or run initial sync without filters to see all collections

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
# Sync all collections
outline-sync sync

# Sync specific collections
outline-sync sync --include "Engineering,Product"

# Sync all except specific collections
outline-sync sync --exclude "Archive,Private"

# With config file
outline-sync sync --config custom-config.json
```

**Watch mode (bidirectional):**

```bash
outline-sync watch

# With filters
outline-sync watch --include "Engineering"
```

**CI/CD mode:**

```bash
outline-sync ci

# With filters
outline-sync ci --exclude "Draft,Private"
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
- `--include <collections>`: Comma-separated list of collection names/IDs to include (e.g., `"Engineering,Product"`). If set, only these collections are synced.
- `--exclude <collections>`: Comma-separated list of collection names/IDs to exclude (e.g., `"Archive,Private"`). Ignored if `--include` is set.

**Examples:**
```bash
# Sync all collections
outline-sync sync --url https://my.outline.app --token <YOUR_TOKEN>

# Sync only Engineering and Product collections
outline-sync sync --include "Engineering,Product"

# Sync all except Archive
outline-sync sync --exclude "Archive"
```

### `outline-sync watch [options]`

Starts a persistent process that watches for changes in your local directory and syncs them to Outline, and also pulls new changes from Outline periodically. This enables bidirectional synchronization.

**Options:**

- `--url <url>`: The URL of your Outline instance.
- `--token <token>`: Your Outline API token.
- `--output <dir>`: The local directory being watched. Default: `./outline-docs`
- `--config <path>`: Path to config file. Default: `./outline-sync.config.json`
- `--include <collections>`: Comma-separated list of collection names/IDs to include.
- `--exclude <collections>`: Comma-separated list of collection names/IDs to exclude.

**Example:**
```bash
outline-sync watch --include "Engineering"
```

### `outline-sync ci [options]`

Executes a CI/CD-friendly synchronization. This command first pulls all documents from Outline, then checks for any local changes in your configured output directory, and finally pushes those local changes back to Outline. Designed for automated environments.

**Options:**

- `--url <url>`: The URL of your Outline instance.
- `--token <token>`: Your Outline API token.
- `--output <dir>`: The local directory to synchronize. Default: `./outline-docs`
- `--config <path>`: Path to config file. Default: `./outline-sync.config.json`
- `--include <collections>`: Comma-separated list of collection names/IDs to include.
- `--exclude <collections>`: Comma-separated list of collection names/IDs to exclude.

**Example:**
```bash
outline-sync ci --exclude "Private,Draft"
```

---

## Examples

### Example 1: Sync Only Engineering Docs

**Config file:**
```json
{
  "url": "https://outline.example.com",
  "token": "your_token",
  "includeCollections": ["Engineering", "API Reference"]
}
```

**CLI:**
```bash
outline-sync sync --include "Engineering,API Reference"
```

### Example 2: Exclude Private Collections

**Config file:**
```json
{
  "url": "https://outline.example.com",
  "token": "your_token",
  "excludeCollections": ["Private", "Archive", "Draft"]
}
```

**CLI:**
```bash
outline-sync sync --exclude "Private,Archive,Draft"
```

### Example 3: Root README with Collection Filter

Place a specific document as your project's main README while only syncing specific collections:

```json
{
  "includeCollections": ["Public Docs"],
  "customPaths": {
    "doc-abc123": "../../README.md"
  }
}
```

### Example 4: Mixed Structure

Combine auto-organized docs with custom locations and collection filtering:

```json
{
  "outputDir": "./docs",
  "includeCollections": ["Engineering", "Product"],
  "customPaths": {
    "doc-home": "../../README.md",
    "doc-api": "../../API.md",
    "doc-contrib": "../../CONTRIBUTING.md"
  }
}
```

Other documents from included collections will be organized in `./docs` by collection.

### Example 5: Getting Collection Names

After first sync without filters, you'll see output like:

```text
Found 5 collections
📚 Syncing collection: Engineering
✓ API Documentation
✓ System Architecture

📚 Syncing collection: Product
✓ Roadmap
✓ Feature Specs
```

Use these names in your `includeCollections` or `excludeCollections` array.

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
