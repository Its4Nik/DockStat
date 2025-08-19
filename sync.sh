#!/usr/bin/env bash

bunx @dockstat/outline-sync@latest \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de"
    sync
