# DashGeometry

A browser-based Geometry Dash–style game built with vanilla JS and HTML5 Canvas.

## How to Play

Open `index.html` in any modern browser — no server required.

| Action | Input |
|--------|-------|
| Jump   | `Space`, `↑`, Click, or Tap |
| Restart | Same as above after death |

Avoid spikes and reach the end of the level.

## File Structure

```
DashGeometry/
├── index.html          — game shell
├── style.css           — full-screen canvas, dark theme
├── js/
│   ├── main.js         — entry point
│   ├── game.js         — game loop, state machine, collision (Claude Code)
│   ├── player.js       — physics: gravity, jump, AABB (Claude Code)
│   ├── level.js        — level data, camera scroll (Claude Code)
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

- Gravity: 0.65 px/frame²
- Jump force: −12.5 px/frame
- Player speed: 5 px/frame (≈300 px/sec at 60 fps)
- Tile size: 40 px
