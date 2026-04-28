#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RC="${SCRIPT_DIR}/.npmrc"

if [ -f "$RC" ]; then
    rm "$RC"
fi

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "Error: NPM_TOKEN is not set. Export GitHub Packages token, e.g. export NPM_TOKEN=ghp_..." >&2
  exit 1
fi

cat >"$RC" <<EOF
@qureai:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
EOF

echo "Wrote ${RC}"
