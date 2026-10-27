#!/usr/bin/env bash
# Copy the pure planner sources into the Lens Studio project, next to the scripts that import them
# (Assets/Scripts/Planner). Lens Studio's own .meta files are left alone.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
dest="$root/lens/Assets/Scripts/Planner"
mkdir -p "$dest"
for f in "$dest"/*.ts; do
  [ -e "$f" ] && [ ! -e "$root/src/planner/$(basename "$f")" ] && rm -f "$f" "$f.meta"
done
cp "$root"/src/planner/*.ts "$dest"/
echo "Synced $(ls "$root"/src/planner/*.ts | wc -l | tr -d ' ') files to lens/Assets/Scripts/Planner"
