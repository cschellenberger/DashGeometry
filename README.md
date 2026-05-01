# DashGeometry

A browser-based Geometry Dash–style game built with vanilla JS and HTML5 Canvas.

## How to Play

Open `index.html` in any modern browser. If your browser blocks ES modules from `file://`, run the folder through any small static server instead, for example `npx serve .`.

Classic Dash is the default level. To start the second level directly, open the page with `?level=ember-ascent`. The browser shell also accepts the legacy alias `?level=jermonji-violet-bridge`.

Validate generated level authoring rules with:

```sh
npm run check
```

| Action | Input |
|--------|-------|
| Jump   | `Space`, `↑`, Click, or Tap |
| Restart | Same as above after death |
| Start Level 2 by URL | `?level=ember-ascent` |

Hold jump input to automatically jump again on landing.

Avoid spikes, use portals, and reach the end of the level.

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
│   ├── level.js        — generated level catalog, themes, camera scroll (Claude Code)
│   ├── levelBuilder.js — reusable level motif helpers
│   ├── levelRules.js   — physics-derived spacing and validation rules
│   ├── renderer.js     — canvas draw calls, parallax, themed portals (Claude Code)
│   └── input.js        — keyboard/mouse/touch handler, level switching (Copilot CLI)
└── scripts/
    ├── validate-level.mjs — generated level validation command
    ├── smoke-portals.mjs — portal linkage smoke test
    ├── smoke-runtime.mjs — headless runtime portal smoke test
    └── orchestrate.sh    — ACP delegation wrapper
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
- Level 2 speed: 3.6 px/frame
- Jump buffering: 6 frames
- Portal cooldown: 16 frames
- Tile size: 40 px

## Level Authoring Rules

- Same-lane spikes must be at least 4 tiles apart.
- Elevated spikes must be fully supported by a block underneath.
- Elevated platforms are limited to one spike at the first-level difficulty.
- Portals must reference a valid paired exit and sit on supported ground or platforms.
- Stair platforms use 9-tile runs with 1-tile approach gaps.
- Levels are generated from reusable motifs and validated when `level.js` loads.
- Movement is frame-scaled against a 60 FPS target so timing is more consistent across devices.
- Spike collision uses an inset triangle hitbox rather than a rectangular proxy.
- Press `L` on menu, win, or death screens to switch between levels.
- Unknown `?level=` values fall back to Classic Dash.
