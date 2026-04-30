# DashGeometry

A browser-based Geometry Dash–style game built with vanilla JS and HTML5 Canvas.

## How to Play

Open `index.html` in any modern browser — no server required.

| Action | Input |
|--------|-------|
| Jump   | `Space`, `↑`, Click, or Tap |
| Restart | Same as above after death |

Hold jump input to automatically jump again on landing.

Avoid spikes and reach the end of the level.

## File Structure

```
DashGeometry/
├── index.html          — game shell
├── style.css           — full-screen canvas, dark theme
├── js/
│   ├── main.js         — entry point
│   ├── game.js         — game loop, state machine, collision (Claude Code)
│   ├── config.js       — shared physics, world, and collision constants
│   ├── player.js       — physics: gravity, jump, AABB (Claude Code)
│   ├── level.js        — generated Level 1, camera scroll (Claude Code)
│   ├── levelBuilder.js — reusable level motif helpers
│   ├── levelRules.js   — physics-derived spacing and validation rules
│   ├── renderer.js     — canvas draw calls, parallax (Claude Code)
│   └── input.js        — keyboard/mouse/touch handler (Copilot CLI)
└── scripts/
    └── orchestrate.sh  — ACP delegation wrapper
```

## Multi-Agent Build

This project was built using a three-agent ACP coordination workflow:

| Agent | Tool | Task |
|-------|------|------|
| **Claude Code** | `claude` | Orchestrator — game engine, physics, renderer |
| **Copilot CLI** | `gh copilot -p` | `js/input.js` input handler |
| **Codex CLI** | `codex exec` | `README.md`, `.gitignore` |

The delegation uses Copilot CLI's non-interactive `-p` flag and Codex CLI's `exec` subcommand as ACP-style subprocess calls. True ACP wire protocol (JSON-RPC 2.0 over NDJSON via `gh copilot --acp`) is deferred as a follow-up enhancement.

## Physics

- Gravity: 0.58 px/frame²
- Jump force: −13.2 px/frame
- Player speed: 3.2 px/frame (≈192 px/sec at 60 fps)
- Jump buffering: 6 frames
- Tile size: 40 px

## Level Authoring Rules

- Same-lane spikes must be at least 4 tiles apart.
- Elevated spikes must be fully supported by a block underneath.
- Elevated platforms are limited to one spike at the first-level difficulty.
- Stair platforms use 9-tile runs with 1-tile approach gaps.
- Level 1 is generated from reusable motifs and validated when `level.js` loads.
- Movement is frame-scaled against a 60 FPS target so timing is more consistent across devices.
- Spike collision uses an inset triangle hitbox rather than a rectangular proxy.
