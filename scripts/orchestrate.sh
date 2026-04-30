#!/usr/bin/env bash
# ACP delegation wrapper — routes tasks to Copilot CLI or Codex CLI non-interactively.
# Usage:
#   copilot_task "prompt"   — delegates to GitHub Copilot CLI
#   codex_task "prompt"     — delegates to OpenAI Codex CLI

set -euo pipefail

copilot_task() {
  local prompt="$1"
  gh copilot -p "$prompt" --allow-all-tools --allow-all-paths 2>&1
}

codex_task() {
  local prompt="$1"
  codex exec -c 'sandbox_permissions=["disk-full-read-access","disk-write-access"]' "$prompt" 2>&1
}

# Example: run the orchestrator with a target task
# copilot_task "Generate a new obstacle sequence for level.js with 80 obstacles"
# codex_task "Add a high score display to renderer.js"
