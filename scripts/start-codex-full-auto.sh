#!/usr/bin/env bash
set -euo pipefail
# Launch Codex CLI in full-auto (sandboxed) mode from the project root
cd "$(dirname "$0")/.."
exec codex --full-auto
