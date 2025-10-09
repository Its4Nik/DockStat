#!/usr/bin/env bash
#set -euo pipefail

BUN_COMMAND="bun install"

folders=(
  "apps/dockstat"
  "apps/dockstore"
  "packages/db"
  "packages/docker-client"
  "packages/logger"
  "packages/outline-sync"
  "packages/plugin-handler"
  "packages/sqlite-wrapper"
  "packages/typings"
)

echo "Folders: ${folders[*]}"

if [[ ${1:-} == "update" ]]; then
  echo "Changed to 'bun update' instead of 'bun install'"
  BUN_COMMAND="bun update"
fi

for element in "${folders[@]}"; do
  echo "Processing $element"
  if [[ -d $element ]]; then
    pushd "$element" > /dev/null
    $BUN_COMMAND
    popd > /dev/null
  else
    echo "Warning: $element does not exist, skipping."
  fi
done
