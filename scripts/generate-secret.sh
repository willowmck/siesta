#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
TEMPLATE="$ROOT_DIR/k8s/secret.yaml.tpl"
OUTPUT="$ROOT_DIR/k8s/secret.yaml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. Copy .env.example to .env and fill in values." >&2
  exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
  echo "Error: $TEMPLATE not found." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

envsubst < "$TEMPLATE" > "$OUTPUT"
echo "Generated $OUTPUT"
