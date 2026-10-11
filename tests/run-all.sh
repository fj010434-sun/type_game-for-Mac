#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export BASE_URL="${BASE_URL:-http://127.0.0.1:18765}"
python3 tests/wardrobe-assets.py
python3 tests/uniform-assets.py
node --test tests/progression.test.mjs tests/wardrobe-expansion.test.mjs
for test in wardrobe-expansion wardrobe-visual wardrobe-motion wardrobe-sample wardrobe-ui wardrobe-game wardrobe-review wardrobe-resources customization scene-combinations; do
  node "tests/$test.cjs"
done
