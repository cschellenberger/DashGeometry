# DashGeometry

A browser-based Geometry Dash–style game built with vanilla JS and HTML5 Canvas.

## How to Play

Open `index.html` in any modern browser. If your browser blocks ES modules from `file://`, run the folder through any small static server instead, for example `npx serve .`.

Classic Dash is the default level. To start the second level directly, open the page with `?level=ember-ascent`. The browser shell also accepts the legacy alias `?level=jermonji-violet-bridge`.

The third level, **Skyward Terraces**, opens with `?level=skyward-terraces`.
It has 20 platforms across climbs and descents, 3 bounce pads, 21 orbs, and
2 portal pairs. Take the portals to cross between elevations, or jump over their
shorter entrances to explore the connecting platforms. Both routes can collect
every orb without breaking the sequence. Press `L` on the menu to cycle levels.

The fourth level, **Clockwork Heights**, opens with `?level=clockwork-heights`.
Its 19 platforms use seeded variation in widths, gaps, and elevations; the same
layout returns on every retry. Avoid 9 rotating sawblades and collect 20 orbs as
the camera follows the climb. Land on the green pad near the end of the ascent
to reach the **2x ACCESS** ledge, 240 pixels above its launch platform. A normal
jump cannot reach it. A return portal brings you down for the final ground run.

Validate generated level authoring rules with:

```sh
npm run check
```

| Action | Input |
|--------|-------|
| Jump   | `Space`, `↑`, Click, or Tap |
| Restart | Same as above after death |
| Start Level 2 by URL | `?level=ember-ascent` |
| Start Level 3 by URL | `?level=skyward-terraces` |
| Start Level 4 by URL | `?level=clockwork-heights` |

Hold jump input to automatically jump again on landing.

The default level has three bright green **2x HEIGHT** bounce pads: before the
first spike, in the middle ground section, and on the later elevated platform.
Jump and land on one to launch automatically to approximately twice the
normal jump height and travel about 41% farther. Running across it or falling
onto it without jumping does not activate it. To try it immediately, hold Space
briefly when starting the level, then release during the first jump.

Jump into the coloured point orbs to collect them: **cyan = 10**, **gold = 25**,
and **pink = 50** points. Their base values are printed inside them. The default
level has 12 orbs, including high pink orbs reachable with the bounce pads.
Consecutive pickups award increasing multipliers: x1, x2, x3, and so on.
Passing an uncollected orb immediately resets the multiplier to x1; your earned
points remain. The next pickup starts a new chain. Score and collected orbs reset
on retry or level change, and the final score appears on death and completion.

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
│   ├── levels/skywardTerraces.js — third-level layout and theme
│   ├── levels/clockworkHeights.js — seeded fourth-level layout and theme
│   ├── portal.js       — portal factories, validation, and runtime system
│   ├── sawblade.js     — sawblade factory, collision, animation, and drawing
│   ├── bouncePad.js    — landing-triggered boost activation
│   ├── scoring.js      — orb definitions, collection, and score sequences
│   ├── renderer.js     — canvas draw calls, parallax, themed portals (Claude Code)
│   └── input.js        — keyboard/mouse/touch handler, level switching (Copilot CLI)
└── scripts/
    ├── validate-level.mjs — generated level validation command
    ├── smoke-portals.mjs — portal system and authoring checks
    ├── smoke-runtime.mjs — headless runtime regression checks
    ├── smoke-terraces.mjs — complete third-level routes at multiple frame steps
    ├── smoke-sawblades.mjs — blade footprint, collision, animation, and validation
    ├── smoke-clockwork.mjs — fourth-level route, camera, and bounce-only access
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

## Bounce Pads

Add a reusable pad with `level.bouncePad(x)` in a level builder. Optional settings
are `{ surfaceY, width, heightMultiplier }`; `surfaceY` is the top of the supporting
ground or block. For example, `level.bouncePad(platform.x, { surfaceY: platform.y })`
places one on a platform. Validation checks support, dimensions, and boost strength.

Defaults live in `BOUNCE_PAD` in `js/config.js`. Themes may override `bouncePad`
and `bouncePadEdge` colours. Landing activation lives in `js/bouncePad.js`, while
`Player.launch()` scales jump velocity by the square root of the height multiplier.
Gravity and horizontal speed stay unchanged; the frame-based simulation makes
measured heights approximate. A boosted landing can also activate another pad.
`npm run check` covers activation, missed/grounded landings, reset behaviour,
elevated pads, and jump height/range at multiple frame steps.

## Orb Scoring

Use `level.orb(x, y, 'cyan' | 'gold' | 'pink')` to place an orb using its top-left
coordinates. `LevelBuilder.build()` automatically assigns internal `sequence`
numbers starting at 1 in left-to-right order, independent of authoring order.
Orbs must have distinct x positions. These numbers are level data, not a server
service; the game currently runs entirely in the browser.

`js/scoring.js` owns `ORB_TYPES` (values and colours), circular collection checks,
and `ScoreSystem` (per-run points, multipliers, collected and missed orbs).
The first pickup earns its base value. Each immediately consecutive sequence
number increases the multiplier by one, with no cap. An out-of-order pickup
starts a new chain at x1. Each orb can award points only once per run.
Collection requires contact during a jump or bounce; grounded contact and falls
without a jump do not collect. Teleports skip intervening orbs and break a chain
when an uncollected orb is passed. Shared level data is never marked as collected.

`npm run check` includes scoring tests and simulated safe routes through all
three pads and their orb pairs at multiple frame steps. The same builder and
scoring system can be used to add orbs to other levels.

## Portals

`js/portal.js` owns `createPortal`, `createPortalPair`, `validatePortals`, and
`PortalSystem`. The runtime system handles destination lookup, trigger bounds,
cooldowns, exit locks, and player/camera placement. `Game` coordinates teleport
effects on scoring and clears buffered jumps; `Renderer.drawPortal()` owns drawing.
Each run and level change creates fresh portal state.

Use the builder to add a pair on any supported surfaces:

```js
level.portalPair({
  entranceX: entryPlatform.x + 240,
  entranceSurfaceY: entryPlatform.y,
  exitX: exitPlatform.x + 40,
  exitSurfaceY: exitPlatform.y,
  height: 80,
});
```

Omitting `idPrefix` generates unique pair IDs. Height defaults to 120 pixels;
Skyward Terraces uses 80-pixel portals so players can jump over the entrances.
`entranceThemeKey` and `exitThemeKey` select colours from the level theme.
Legacy `entranceLane`/`exitLane` options remain supported (0 means ground);
explicit surface coordinates also work on the first platform lane.
Validation rejects missing or mismatched pairs, duplicate IDs, invalid dimensions,
unsupported exits, and nearby hazards (spikes or sawblades). Exit support includes the player's full
width after the teleport offset.

`npm run check` exercises portal behavior in every level and completes both
Skyward Terraces routes at frame scales 0.5, 1, and 2. Each route uses all three
bounce pads and collects all 21 orbs for 3,905 points.

## Sawblades and Higher Platforms

`js/sawblade.js` owns the sawblade factory, defaults, circular collision check,
validation, rotation, and drawing. Blades use the same 40x40 world-space footprint
as triangle spikes. Their circular hitbox is inset slightly, and the existing
player collision margin is preserved. Tooth rotation is visual: collision size
stays constant so safe clearance does not depend on the animation frame.

```js
level.sawblade(x); // On the ground.
level.sawblade(platform.x + 240, {
  surfaceY: platform.y,
  spin: -1, // Reverse rotation; defaults to 1.
  phase: Math.PI / 4,
});
```

Themes can override `sawblade`, `sawbladeEdge`, and `sawbladeHub`. Blade rotation
uses per-run elapsed game frames, resets on retry, and freezes when play stops.
Validation checks the tile footprint, support, hazard spacing, and portal exit
clearance. Orbs and platforms retain their existing independent behavior.

Platform lanes can extend above the original screen: `level.block(x, lane, widthInTiles)`
accepts higher lane numbers and produces negative world Y coordinates as needed.
Set `verticalCamera: true` on a level definition to follow these heights. World
objects move with the camera while the HUD and menus remain fixed. The first
three levels retain their original vertical view.

Clockwork Heights uses `CLOCKWORK_SEED` and `buildClockworkHeights()` in its level
module. Random choices stay within bounded width, gap, and step-height options;
the bounce-only ledge is deliberately authored rather than randomly placed.
Changing the seed creates a different layout and requires route testing before
shipping it. The current seed is tested from start to finish at frame scales
0.5, 1, and 2, collecting all 20 orbs for 4,380 points. Tests also verify that
removing the bounce pad prevents access to the high ledge and that its 240-pixel
rise exceeds the theoretical normal-jump maximum.
