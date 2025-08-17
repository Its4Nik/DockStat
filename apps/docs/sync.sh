#!/usr/bin/env bash

# Init files
bunx @dockstat/outline-sync@latest \
    --init \
    --collection-id="$OUTLINE_COLLECTION_ID" \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de"

# Sync files
bunx @dockstat/outline-sync@latest \
    --collection-id="$OUTLINE_COLLECTION_ID" \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de"
