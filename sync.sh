#!/usr/bin/env bash

bun run packages/outline-sync/bin/cli.ts \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de"
    sync
