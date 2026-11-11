import assert from 'node:assert/strict';
import { canvas } from './helpers/runtimeHarness.mjs';
import { Game } from '../js/game.js';
import { Player } from '../js/player.js';
import { LEVELS, getLevelDefinition } from '../js/level.js';
import { PLAYER_PHYSICS } from '../js/config.js';
import { ORB_TYPES } from '../js/scoring.js';
import { CLOCKWORK_HEIGHTS_LEVEL_ID, CLOCKWORK_SEED, buildClockworkHeights } from '../js/levels/clockworkHeights.js';

const definition = getLevelDefinition(CLOCKWORK_HEIGHTS_LEVEL_ID);
const blocks = definition.data.filter(o => o.type === 'block');
const launch = blocks.find(o => o.id === 'clockwork-launch');
const summit = blocks.find(o => o.id === 'clockwork-summit');
const rise = launch.y - summit.y;
assert.equal(rise, 240);
assert.ok(rise > PLAYER_PHYSICS.JUMP_FORCE ** 2 / (2 * PLAYER_PHYSICS.GRAVITY));
assert.ok(summit.y < 0, 'The summit extends above the original viewport.');
assert.equal(blocks.filter(o => o.requiresBounce).length, 1);
assert.ok(blocks.filter(o => o.x < summit.x).every(o => o.y >= launch.y), 'No earlier platform bypasses the required boost.');
assert.ok(definition.data.filter(o => o.type === 'portal' && o.role === 'exit').every(o => o.x > summit.x + summit.w), 'No portal provides an alternate summit arrival.');
assert.ok(new Set(blocks.map(o => o.w)).size >= 4);
assert.ok(new Set(blocks.slice(1).map((o, i) => o.x - blocks[i].x - blocks[i].w)).size >= 3);
assert.deepEqual(buildClockworkHeights(definition.rules).data, definition.data, 'A retry regenerates the same seeded course.');
assert.notDeepEqual(buildClockworkHeights(definition.rules, CLOCKWORK_SEED + 1).data, definition.data, 'The seed controls actual layout variation.');

for (const frameScale of [0.5, 1, 2]) {
  const game = new Game(canvas, { levelId: CLOCKWORK_HEIGHTS_LEVEL_ID });
  game._restart();
  const jumps = blocks.flatMap(block => block.id === launch.id ? [block.x - 85, block.x + 240]
    : block.id === summit.id ? [block.x + 140]
      : [block.x - 85, ...(block.w >= 360 ? [block.x + 140] : [])]);
  jumps.push(definition.data.filter(o => o.type === 'sawblade').at(-1).x - 100);
  jumps.sort((a, b) => a - b);
  let bounces = 0;
  let teleports = 0;
  let landedOnSummit = false;
  let highestCamera = 0;
  for (let frame = 0; frame < 12000 && game.state === 'playing'; frame++) {
    const worldX = game.player.x + game.level.cameraX;
    while (jumps.length && worldX > jumps[0] + 80) jumps.shift();
    if (jumps.length && worldX >= jumps[0] && game.player.isGrounded) {
      jumps.shift();
      game._queueJump();
    }
    const oldVelocity = game.player.vy;
    const oldCamera = game.level.cameraX;
    game._update(frameScale);
    if (oldVelocity > 0 && game.player.vy < -15) bounces++;
    if (game.level.cameraX - oldCamera > 10) teleports++;
    if (game.player.isGrounded && game.player.bottom === summit.y &&
        game.player.x + game.level.cameraX >= summit.x) landedOnSummit = true;
    highestCamera = Math.min(highestCamera, game.level.cameraY);
    assert.ok(game.player.top - game.level.cameraY >= 70, 'Player remains below the fixed HUD.');
    assert.ok(game.player.bottom - game.level.cameraY <= 600, 'Player remains visible during descent and teleport.');
    if (frame % 60 === 0) game._render();
  }
  assert.equal(game.state, 'win');
  assert.equal(bounces, 1);
  assert.equal(teleports, 1);
  assert.ok(landedOnSummit);
  assert.ok(highestCamera < -300);
  assert.equal(game.scoring.collected.size, 20);
  assert.equal(game.scoring.missed.size, 0);
  const expectedScore = game.scoring.orbs.reduce((sum, orb) => sum + ORB_TYPES[orb.kind].points * orb.sequence, 0);
  assert.equal(game.scoring.total, expectedScore);
  game._render();
  game._restart();
  assert.equal(game.level.cameraY, 0);
  assert.equal(game.level.elapsedFrames, 0);

  // Try the same launch without its bounce pad. A normal jump passes beneath
  // the high ledge; it must never land there at any supported frame step.
  game.level.data = game.level.data.filter(o => o.type !== 'bouncePad');
  game.level.cameraX = launch.x + 240 - game.player.x;
  game.player.placeAt(launch.y - game.player.h);
  game._queueJump();
  let normalReachedSummit = false;
  for (let frame = 0; frame < 800 && game.state === 'playing'; frame++) {
    game._update(frameScale);
    if (game.player.isGrounded && game.player.bottom === summit.y) normalReachedSummit = true;
    if (game.player.left + game.level.cameraX > summit.x + summit.w) break;
  }
  assert.equal(normalReachedSummit, false);

  const normal = new Player();
  normal.placeAt(launch.y - normal.h);
  normal.jump();
  let maxRise = 0;
  for (let frame = 0; frame < 200 && normal.vy < 0; frame++) {
    normal.update(frameScale);
    maxRise = Math.max(maxRise, launch.y - normal.bottom);
  }
  assert.ok(maxRise < rise, 'No normal-jump timing can bridge the vertical difference.');
  console.log(`Clockwork Heights: frame scale ${frameScale}, summit reached by boost only, all 20 orbs, ${expectedScore} points.`);
}

for (const oldLevel of LEVELS.filter(o => o.id !== CLOCKWORK_HEIGHTS_LEVEL_ID)) {
  const game = new Game(canvas, { levelId: oldLevel.id });
  game.player.y = -400;
  game.level.trackPlayer(game.player, 2);
  assert.equal(game.level.cameraY, 0, 'Existing levels retain their fixed vertical view.');
}
console.log('Clockwork Heights seed, full route, vertical camera, and bounce-only access smoke passed.');
