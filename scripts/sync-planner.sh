#!/usr/bin/env bash
# Copy the pure planner sources into the Lens Studio project's assets.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
dest="$root/lens/Assets/Planner"
mkdir -p "$dest"
rm -f "$dest"/*.ts
cp "$root"/src/planner/*.ts "$dest"/
echo "Synced $(ls "$dest" | wc -l | tr -d ' ') files to lens/Assets/Planner"
