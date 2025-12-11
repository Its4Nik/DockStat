# Outline Sync

Bidirectional sync for Outline wiki to local folders with CI/CD support.

## Installation

```bash
bun install
bun run build
```

## Usage

### Environment Variables

Set these or pass as CLI arguments:

```bash
export OUTLINE_URL=https://your-outline.com
export OUTLINE_TOKEN=your_api_token
```

### Commands

**One-time sync (down only):**

```bash
bun run sync
```

**Watch mode (bidirectional):**

```bash
bun run watch
```

**CI/CD mode:**

```bash
bun run ci
```

### Custom CLI

```bash
# Sync down
outline-sync sync --url https://outline.com --token TOKEN

# Watch for changes
outline-sync watch --output ./docs

# CI/CD sync
outline-sync ci
```

## API Reference (CLI Commands)

### `outline-sync sync [options]`

Performs a one-time synchronization from your Outline wiki to your local folder. This command only pulls changes from Outline.

**Options:**

- `--url <url>` (Required, can be set via `OUTLINE_URL` env var): The URL of your Outline instance (e.g., `https://my.outline.app`).
- `--token <token>` (Required, can be set via `OUTLINE_TOKEN` env var): Your Outline API token. Generate one in Outline's settings.
- `--output <dir>` (Default: `./outline-docs`): The local directory where documents will be stored.

**Example:**
```bash
outline-sync sync --url https://my.outline.app --token <YOUR_TOKEN> --output ~/my-wiki
```

### `outline-sync watch [options]`

Starts a persistent process that watches for changes in your local directory and syncs them to Outline, and also pulls new changes from Outline periodically. This enables bidirectional synchronization.

**Options:**

- `--url <url>` (Required, can be set via `OUTLINE_URL` env var): The URL of your Outline instance.
- `--token <token>` (Required, can be set via `OUTLINE_TOKEN` env var): Your Outline API token.
- `--output <dir>` (Default: `./outline-docs`): The local directory being watched.

**Example:**
```bash
outline-sync watch
```

### `outline-sync ci [options]`

Executes a CI/CD-friendly synchronization. This command first pulls all documents from Outline, then checks for any local changes in your configured output directory, and finally pushes those local changes back to Outline. Designed for automated environments.

**Options:**

- `--url <url>` (Required, can be set via `OUTLINE_URL` env var): The URL of your Outline instance.
- `--token <token>` (Required, can be set via `OUTLINE_TOKEN` env var): Your Outline API token.
- `--output <dir>` (Default: `./outline-docs`): The local directory to synchronize.

**Example:**
```bash
outline-sync ci --output ./project-docs
```

---

## Features

- ✅ Sync Outline → Local
- ✅ Sync Local → Outline
- ✅ Each doc in own folder with README.md
- ✅ Frontmatter metadata preservation
- ✅ Custom path mapping
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

## License

MIT
