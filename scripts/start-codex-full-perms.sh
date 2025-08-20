#!/usr/bin/env bash
set -euo pipefail
# Launch Codex CLI in FULL PERMISSIONS mode (no approvals, no sandbox)
# DANGEROUS: This bypasses all approvals and sandbox protections.
cd "$(dirname "$0")/.."
exec codex --dangerously-bypass-approvals-and-sandbox
