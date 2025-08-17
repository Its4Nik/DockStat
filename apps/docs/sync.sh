#!/usr/bin/env bash

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
