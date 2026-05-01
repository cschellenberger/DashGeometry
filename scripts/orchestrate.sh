#!/usr/bin/env bash
# Non-interactive delegation wrapper for the local CLI agents.
# Usage:
#   copilot_task "prompt"   # Copilot write set: js/input.js, js/main.js, index.html,
#                           # style.css, README.md, scripts/orchestrate.sh,
#                           # research/run-03-github-copilot-new-level-assist-tasks.md
#   codex_task "prompt"     # Codex write set: js/config.js, js/levelRules.js,
#                           # js/levelBuilder.js, js/level.js, scripts/validate-level.mjs,
#                           # package.json, research/run-03-codex-new-level-implementation-tasks.md

set -euo pipefail

copilot_task() {
  local prompt="$1"
  gh copilot -p "$prompt" --allow-all-tools --allow-all-paths 2>&1
}

codex_task() {
  local prompt="$1"
  codex exec -c 'sandbox_permissions=["disk-full-read-access","disk-write-access"]' "$prompt" 2>&1
}

# Example prompts that stay inside the assigned write sets:
# copilot_task "Update js/main.js and README.md so ?level=ember-ascent selects the second level."
# codex_task "Update js/level.js and scripts/validate-level.mjs to add Ember Ascent and validate every level."
