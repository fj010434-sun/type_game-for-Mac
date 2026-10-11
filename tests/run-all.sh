#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export BASE_URL="${BASE_URL:-http://127.0.0.1:18765}"
python3 tests/wardrobe-assets.py
node --test tests/progression.test.mjs
for test in wardrobe-sample wardrobe-ui wardrobe-game wardrobe-review customization scene-combinations; do
  node "tests/$test.cjs"
done
