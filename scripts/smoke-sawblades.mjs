import assert from 'node:assert/strict';
import { canvas } from './helpers/runtimeHarness.mjs';
import { TILE, WORLD } from '../js/config.js';
import { Player } from '../js/player.js';
import { Game } from '../js/game.js';
import { LevelBuilder } from '../js/levelBuilder.js';
import { createSawblade, hitsSawblade, sawbladeAngle, drawSawblade } from '../js/sawblade.js';

const saw = createSawblade(400, WORLD.GROUND_Y);
assert.equal(saw.w, TILE);
assert.equal(saw.h, TILE);
assert.equal(saw.y + saw.h, WORLD.GROUND_Y);
const player = new Player();
player.x = 400;
player.placeAt(WORLD.GROUND_Y - player.h);
assert.ok(hitsSawblade(player, saw, 0), 'Running into a blade is lethal.');
player.x = 120;
assert.ok(hitsSawblade(player, saw, 280), 'Hit testing uses world coordinates.');
player.y = saw.y - player.h - 1;
assert.equal(hitsSawblade(player, saw, 280), false, 'A jump above the teeth is safe.');
player.x = 400 - player.w;
player.y = saw.y - player.h;
assert.equal(hitsSawblade(player, saw, 0), false, 'The empty bounding-box corner is not a circular blade.');
player.x = 400;
player.y = saw.y;
assert.equal(hitsSawblade(player, { ...saw, phase: Math.PI }, 0), hitsSawblade(player, saw, 0), 'Rotation never creates an unpredictable hitbox.');

const rotations = [];
const vertices = [];
const ctx = { ...canvas.getContext(), rotate(angle) { rotations.push(angle); },
  moveTo(x, y) { vertices.push([x, y]); }, lineTo(x, y) { vertices.push([x, y]); } };
drawSawblade(ctx, saw, 0, 0);
const firstPose = rotations[0];
rotations.length = 0;
drawSawblade(ctx, saw, 0, 8);
assert.notEqual(rotations[0], firstPose, 'The rendered blade actually rotates over time.');
assert.ok(vertices.every(([x, y]) => Math.hypot(x, y) <= TILE / 2 - 0.5 + 1e-8), 'Tooth strokes stay within the spike footprint.');
assert.equal(sawbladeAngle({ ...saw, spin: -1 }, 10), -sawbladeAngle(saw, 10));

const unsupported = new LevelBuilder();
unsupported.sawblade(400, { surfaceY: 300 });
assert.throws(() => unsupported.build(), /not fully supported/);
const invalid = new LevelBuilder();
invalid.sawblade(400, { spin: 0 });
assert.throws(() => invalid.build(), /nonzero spin/);
const cramped = new LevelBuilder();
cramped.sawblade(400);
cramped.spike(440);
assert.throws(() => cramped.build(), /too close/);
const blockedExit = new LevelBuilder();
blockedExit.portalPair({ entranceX: 400, exitX: 800 });
blockedExit.sawblade(820);
assert.throws(() => blockedExit.build(), /overlaps|before/);

// Check the actual game-loop collision dispatch, not just the helper.
const game = new Game(canvas);
game._restart();
const builder = new LevelBuilder();
builder.sawblade(400);
game.level.data = builder.build().data;
game.level.cameraX = 400 - game.player.x;
game.player.placeAt(WORLD.GROUND_Y - game.player.h);
game._update(1);
assert.equal(game.state, 'dead');
console.log('Sawblade size, animation, circular collision, authoring, and runtime smoke passed.');
