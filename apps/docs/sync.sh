#!/usr/bin/env bash

# Init files
bunx @dockstat/outline-sync \
    --init \
    --collection-id="$OUTLINE_COLLECTION_ID" \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de"

# Sync files
bunx @dockstat/outline-sync \
    --collection-id="$OUTLINE_COLLECTION_ID" \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de"
