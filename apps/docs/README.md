# Documentation Sync

This directory contains the documentation files and synchronization setup for bi-directional sync with Outline Wiki. It uses the `@dockstat/outline-sync` package to keep documentation in sync between the Git repository and Outline.

## 🚀 Features

- **Bi-directional Sync**: Changes in Git or Outline are synchronized
- **Git-first**: Uses Git commit timestamps for change detection
- **Safe Backups**: Creates backups before overwriting local files
- **Collection Management**: Manages a single Outline collection
- **Dry-run Support**: Preview changes before applying them

## 📁 Structure

```
apps/docs/
├── docs/                 # Markdown documentation files
│   ├── dockstat.md      # Main DockStat documentation
│   ├── contribute.md    # Contribution guidelines
│   ├── archive/         # Archived versions
│   └── ...              # Other documentation
├── pages.json           # Outline sync manifest
├── sync.sh             # Sync script wrapper
└── README.md           # This file
```

## 🛠️ Setup

### Prerequisites

- [Bun](https://bun.sh/) >= 1.2.17
- Outline API key with collection access
- Git repository with committed documentation

### Environment Variables

Create a `.env.local` file or set environment variables:

```bash
# Required: Outline API key
export OUTLINE_API_KEY="sk_live_your_api_key_here"

# Required: Collection ID
export OUTLINE_COLLECTION_ID="your-collection-uuid"

# Note: This setup uses https://outline.itsnik.de as the base URL
```

### Initial Setup

1. **Get your Outline API key**:
   - Go to your Outline instance → Settings → API Tokens
   - Create a new token with collection read/write permissions

2. **List available collections**:
   ```bash
   cd apps/docs
   bunx @dockstat/outline-sync@latest --list-collections --api-key="$OUTLINE_API_KEY" --base-url="https://outline.itsnik.de"
   ```

3. **Bootstrap from existing Outline collection** (recommended):
   ```bash
   # This will create pages.json and populate docs/ directory
   OUTLINE_COLLECTION_ID=your-id OUTLINE_API_KEY=sk_xxx ./sync.sh
   ```

4. **Review and commit the generated files**:
   ```bash
   git add pages.json docs/
   git commit -m "docs: bootstrap Outline sync manifest"
   ```

## 🔄 Usage

### Manual Sync

```bash
# Sync changes (both directions)
OUTLINE_COLLECTION_ID=your-id OUTLINE_API_KEY=sk_xxx ./sync.sh

# Or run directly with bunx
bunx @dockstat/outline-sync@latest \
    --collection-id="$OUTLINE_COLLECTION_ID" \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de"

# Preview changes without applying
bunx @dockstat/outline-sync@latest \
    --collection-id="$OUTLINE_COLLECTION_ID" \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de" \
    --dry-run
```

### How Sync Works

The sync process compares timestamps to determine what to sync:

1. **Local → Outline**: When local files are newer (based on Git commit time)
2. **Outline → Local**: When Outline documents are newer
3. **Skip**: When timestamps are equal (within 500ms tolerance)

### Sync Script

The included `sync.sh` script uses the published package:

```bash
#!/usr/bin/env bash

touch pages.json

echo "Starting sync"
echo "Previous page file:"
cat pages.json

# Init files
bunx @dockstat/outline-sync@latest \
    --init \
    --collection-id="$OUTLINE_COLLECTION_ID" \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de"

echo "New page file:"
cat pages.json

# Sync files
bunx @dockstat/outline-sync@latest \
    --collection-id="$OUTLINE_COLLECTION_ID" \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de"

ls docs
```

## 📝 Managing Documentation

### Adding New Pages

1. **Create the Markdown file**:
   ```bash
   # Create new documentation file
   echo "# New Feature" > docs/new-feature.md
   ```

2. **Update pages.json**:
   ```json
   {
     "collectionId": "your-collection-id",
     "pages": [
       {
         "title": "New Feature",
         "file": "docs/new-feature.md",
         "id": null,
         "children": []
       }
     ]
   }
   ```

3. **Commit and sync**:
   ```bash
   git add docs/new-feature.md pages.json
   git commit -m "docs: add new feature documentation"
   ./sync.sh
   ```

### Editing Existing Pages

1. **Edit locally**:
   ```bash
   # Edit the file
   vim docs/existing-page.md
   
   # Commit changes
   git add docs/existing-page.md
   git commit -m "docs: update existing page"
   ```

2. **Sync to Outline**:
   ```bash
   OUTLINE_COLLECTION_ID=your-id OUTLINE_API_KEY=sk_xxx ./sync.sh
   ```

### Organizing Pages

The `pages.json` file defines the page hierarchy:

```json
{
  "collectionId": "your-collection-id",
  "pages": [
    {
      "title": "Parent Page",
      "file": "docs/parent.md",
      "id": "outline-doc-id",
      "children": [
        {
          "title": "Child Page",
          "file": "docs/child.md",
          "id": "child-doc-id",
          "children": []
        }
      ]
    }
  ]
}
```

## 🔧 Configuration

### Manifest File (pages.json)

- `collectionId`: Target Outline collection UUID
- `title`: Document title in Outline
- `file`: Relative path to Markdown file
- `id`: Outline document ID (null for new documents)
- `children`: Nested page structure

### Sync Behavior

- **Timestamp Detection**: Prefers Git commit timestamps over file mtime
- **Conflict Resolution**: Newer timestamp wins
- **Backup Strategy**: Creates `.outline-sync.bak.<timestamp>` files
- **Rate Limiting**: Built-in retry for API rate limits

## 🔄 CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Sync Documentation

on:
  push:
    paths:
      - 'apps/docs/**'
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  sync-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: '1.2.17'
          
      - run: bun install
      
      - name: Sync Documentation
        env:
          OUTLINE_API_KEY: ${{ secrets.OUTLINE_API_KEY }}
          OUTLINE_COLLECTION_ID: ${{ secrets.OUTLINE_COLLECTION_ID }}
        run: |
          cd apps/docs
          ./sync.sh
          
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add apps/docs/
          git commit -m "docs: sync from Outline" || exit 0
          git push
```

## 🛡️ Safety Features

- **Dry-run Mode**: Preview changes with `--dry-run`
- **Automatic Backups**: Local files backed up before overwrite
- **Git Integration**: Uses commit timestamps for reliable change detection
- **Error Handling**: Graceful handling of API failures and conflicts

## 🔍 Troubleshooting

### Common Issues

**API Key Issues**:
```bash
# Verify API key works
curl -H "Authorization: Bearer $OUTLINE_API_KEY" \
     https://app.getoutline.com/api/auth.info
```

**Collection Not Found**:
```bash
# List available collections
bunx @dockstat/outline-sync@latest --list-collections --api-key="$OUTLINE_API_KEY" --base-url="https://outline.itsnik.de"
```

**Sync Conflicts**:
```bash
# Use dry-run to preview changes
bunx @dockstat/outline-sync@latest \
    --collection-id="$OUTLINE_COLLECTION_ID" \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de" \
    --dry-run

# Check Git status for uncommitted changes
git status
```

**File Permissions**:
```bash
# Make sync script executable
chmod +x sync.sh
```

## 📄 License

Part of the DockStat monorepo - MIT License.

For more details about the sync tool, see the [outline-sync package documentation](../../packages/outline-sync/README.md).