#!/usr/bin/env bash

bun run packages/outline-sync/bin/cli.ts \
    sync \
    --api-key="$OUTLINE_API_KEY" \
    --base-url="https://outline.itsnik.de"
