#!/usr/bin/env bash
set -euo pipefail

npm run build

OUTPUT=$(netlify deploy --prod --json)
echo "$OUTPUT"

LIVE_URL=$(echo "$OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('url',''))" 2>/dev/null || true)

if [[ -n "$LIVE_URL" ]]; then
  echo ""
  echo "Live URL: $LIVE_URL"
fi
