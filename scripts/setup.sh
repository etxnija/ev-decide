#!/usr/bin/env bash
set -euo pipefail

echo "=== EV Decide — one-time setup ==="
echo ""

# 1. Check prerequisites
echo "Checking prerequisites..."
for cmd in node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' is not installed. Please install Node.js first." >&2
    exit 1
  fi
done
if ! command -v netlify &>/dev/null; then
  echo "Netlify CLI not found. Installing globally..."
  npm install -g netlify-cli
fi
echo "OK: node $(node --version), npm $(npm --version), netlify $(netlify --version)"
echo ""

# 2. Prompt for GitHub PAT
read -rsp "Enter your GitHub PAT (gist scope only): " GITHUB_PAT
echo ""

if [[ -z "$GITHUB_PAT" ]]; then
  echo "ERROR: PAT cannot be empty." >&2
  exit 1
fi

# Validate PAT via GET /user
echo "Validating PAT..."
GH_USER=$(curl -sf -H "Authorization: Bearer ${GITHUB_PAT}" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user | python3 -c "import sys,json; print(json.load(sys.stdin)['login'])" 2>/dev/null || true)

if [[ -z "$GH_USER" ]]; then
  echo "ERROR: PAT validation failed. Check that the token has 'gist' scope." >&2
  exit 1
fi
echo "Authenticated as: $GH_USER"
echo ""

# 3. Create secret Gist
echo "Creating secret Gist..."
GIST_PAYLOAD='{"description":"EV Decide sync","public":false,"files":{"ev-decide-sync.json":{"content":"{\"vehicles\":[],\"notes\":{},\"carbonIntensity\":[],\"weights\":{},\"selection\":[],\"updatedAt\":\"\"}"}}}'

GIST_ID=$(curl -sf \
  -X POST \
  -H "Authorization: Bearer ${GITHUB_PAT}" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  -d "$GIST_PAYLOAD" \
  https://api.github.com/gists | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)

if [[ -z "$GIST_ID" ]]; then
  echo "ERROR: Failed to create Gist." >&2
  exit 1
fi
echo "Gist created: $GIST_ID"
echo ""

# 4. Netlify login + init
echo "Setting up Netlify..."
netlify login
netlify init
echo ""

# 5. Summary
echo "=============================="
echo "Setup complete!"
echo ""
echo "Gist ID : $GIST_ID"
echo "GitHub PAT : (the one you entered above)"
echo ""
echo "Paste both into the app's Settings panel on every device."
echo "=============================="
