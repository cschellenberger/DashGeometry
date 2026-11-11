import assert from 'node:assert/strict';
import { PLAYER_PHYSICS, WORLD } from '../js/config.js';
import { LEVELS } from '../js/level.js';
import { LevelBuilder } from '../js/levelBuilder.js';

import { canvas } from './helpers/runtimeHarness.mjs';

const { Game } = await import('../js/game.js');

const game = new Game(canvas, { levelId: 'ember-ascent' });
if (game.level.id !== 'ember-ascent') {
  throw new Error(`Expected ember-ascent, got ${game.level.id}.`);
}

const entrance = game.level.data.find(o => o.type === 'portal' && o.role === 'entrance');
if (!entrance) {
  throw new Error('No portal entrance found.');
}

const exit = game.portals.getTarget(entrance.targetId);
if (!exit) {
  throw new Error(`No portal exit found for ${entrance.id}.`);
}

game.state = 'playing';
game.level.cameraX = entrance.x - game.player.x;
game.player.y = entrance.y + 10;
game.player.prevY = game.player.y;
game.player.vy = 0;

const cameraBefore = game.level.cameraX;
game._update(1);

if (game.portals.lockId !== exit.id) {
  throw new Error(`Expected portal lock ${exit.id}, got ${game.portals.lockId}.`);
}

if (game.level.cameraX <= cameraBefore) {
  throw new Error('Portal teleport did not advance the camera.');
}

console.log('Runtime portal smoke passed.');

function newGame() {
  const game = new Game(canvas);
  game._restart();
  return game;
}

assert.equal(LEVELS[0].data.filter(o => o.type === 'bouncePad').length, 3);
const pad = LEVELS[0].data.find(o => o.type === 'bouncePad');
assert.ok(pad, 'Test pad belongs to the default level.');

// Run through the real opening: one normal jump, automatic bounce, then a
// safe landing before the first spike. Sample the actual physics trajectory.
for (const frameScale of [0.5, 1, 2]) {
  const game = newGame();
  while (!game.player.isGrounded) game._update(frameScale);
  const groundY = game.player.y;
  game._queueJump();
  let phase = 'jump';
  let normalHeight = 0;
  let bounceHeight = 0;
  const takeoffX = game.level.cameraX;
  let bounceX;
  let landingX;
  for (let frame = 0; frame < 300; frame++) {
    const previousVy = game.player.vy;
    game._update(frameScale);
    assert.equal(game.state, 'playing', 'Opening bounce path must remain safe.');
    if (phase === 'jump' && previousVy > 0 && game.player.vy < 0) {
      phase = 'bounce';
      bounceX = game.level.cameraX;
      assert.equal(game.player.isGrounded, false);
    }
    if (phase === 'jump') normalHeight = Math.max(normalHeight, groundY - game.player.y);
    else bounceHeight = Math.max(bounceHeight, groundY - game.player.y);
    if (phase === 'bounce' && game.player.isGrounded) {
      landingX = game.level.cameraX;
      break;
    }
  }
  assert.ok(landingX !== undefined, 'Jump must hit the pad and finish the bounce.');
  assert.ok(Math.abs(bounceHeight / normalHeight - 2) < 0.09, 'Height should be approximately doubled at supported frame steps.');
  const distanceRatio = (landingX - bounceX) / (bounceX - takeoffX);
  assert.ok(Math.abs(distanceRatio - Math.SQRT2) < 0.07, 'Horizontal range should follow the unchanged gravity and running speed.');
  assert.equal(game.player.hasJumped, false, 'Ordinary landing consumes jump eligibility.');
  console.log(`Bounce at frame scale ${frameScale}: ${normalHeight.toFixed(1)}px -> ${bounceHeight.toFixed(1)}px height; ${distanceRatio.toFixed(2)}x range.`);
}

const walking = newGame();
while (walking.player.x + walking.level.cameraX < pad.x + pad.w + 40) {
  walking._update(1);
  assert.ok(walking.player.vy >= 0, 'Running across the pad must not launch the player.');
  assert.equal(walking.state, 'playing');
}

// Falling without a jump (including a spawn above the pad) cannot activate it.
const falling = newGame();
falling.level.cameraX = pad.x - falling.player.x;
falling.player.y = pad.y - falling.player.h - 1;
falling.player.vy = 3;
falling._update(1);
assert.equal(falling.player.vy, 0);
assert.equal(falling.player.isGrounded, true);

// A previous jump that missed the pad cannot arm a later grounded crossing.
const missed = newGame();
missed.player.placeAt(WORLD.GROUND_Y - missed.player.h);
missed.player.jump();
missed.player.y = WORLD.GROUND_Y - missed.player.h - 1;
missed.player.vy = 3;
missed._update(1);
assert.equal(missed.player.hasJumped, false);
missed.level.cameraX = pad.x - missed.player.x;
missed._update(1);
assert.equal(missed.player.vy, 0);

// Reuse on an elevated platform, regardless of object insertion order.
const builder = new LevelBuilder();
const elevatedPad = builder.bouncePad(280, { surfaceY: 480 });
builder.block(260, 1, 4);
const elevated = newGame();
elevated.level.data = builder.build().data;
elevated.level.cameraX = elevatedPad.x - elevated.player.x;
elevated.player.placeAt(elevatedPad.y - elevated.player.h);
elevated.player.jump();
elevated.player.y -= 1;
elevated.player.vy = 3;
elevated.input.jumpHeld = true;
elevated._update(1);
assert.equal(elevated.player.vy, PLAYER_PHYSICS.JUMP_FORCE * Math.SQRT2);
assert.equal(elevated.jumpBufferFrames, 0, 'Bounce takes priority over buffered input.');
elevated._update(1);
assert.ok(elevated.player.vy < PLAYER_PHYSICS.JUMP_FORCE, 'Held jump must not replace the boosted launch.');

elevated._restart();
assert.equal(elevated.player.hasJumped, false);
elevated._cycleLevel();
assert.equal(elevated.player.hasJumped, false);
elevated.player.hasJumped = true;
elevated._teleportToPortal(exit);
assert.equal(elevated.player.hasJumped, false, 'Teleport placement must clear jump eligibility.');

const unsupported = new LevelBuilder();
unsupported.bouncePad(280, { surfaceY: 400 });
assert.throws(() => unsupported.build(), /not fully supported/);
const invalid = new LevelBuilder();
invalid.bouncePad(280, { heightMultiplier: -2 });
assert.throws(() => invalid.build(), /height multiplier/);

// Exercise the new drawing path with the same canvas stub as the runtime test.
newGame()._render();
console.log('Runtime bounce-pad smoke passed.');

// Test each authored pad and its pair of orbs using the real collision loop.
// The middle approach begins after the preceding spike; the elevated approach
// jumps over its platform spike before landing on the pad.
for (const frameScale of [0.5, 1, 2]) {
  for (const [index, startX] of [120, 2640, 5348].entries()) {
    const game = newGame();
    const pads = game.level.data.filter(o => o.type === 'bouncePad');
    game.level.cameraX = startX - game.player.x;
    game.player.placeAt(pads[index].y - game.player.h);
    game._queueJump();
    let bounced = false;
    let landed = false;
    for (let frame = 0; frame < 300; frame++) {
      const previousVy = game.player.vy;
      game._update(frameScale);
      assert.equal(game.state, 'playing', `Pad ${index + 1} must have a safe path at frame scale ${frameScale}.`);
      if (previousVy > 0 && game.player.vy < 0) bounced = true;
      if (bounced && game.player.isGrounded) { landed = true; break; }
    }
    assert.ok(landed, `Pad ${index + 1} must activate and land.`);
    assert.equal(game.scoring.collected.size, 2, `Both orbs around pad ${index + 1} must be reachable.`);
    assert.equal(game.scoring.multiplier, 2);
    assert.equal(game.scoring.total, index === 2 ? 125 : 110);
    game._render();
    game.state = 'dead';
    game._render();
    assert.ok(game.scoring.total > 0, 'Final score remains available on death.');
    game.state = 'win';
    game._render();
    game._restart();
    assert.equal(game.scoring.total, 0);
    assert.equal(game.scoring.collected.size, 0);
    assert.equal(game.scoring.multiplier, 1);
    game._cycleLevel();
    assert.equal(game.scoring.total, 0);
    assert.equal(game.scoring.orbs.length, 0, 'Level switch uses that level\'s own orb catalog.');
  }
}

const teleporting = newGame();
teleporting.scoring.collect(teleporting.scoring.orbs[0]);
teleporting.scoring.collect(teleporting.scoring.orbs[1]);
teleporting._teleportToPortal({ x: 1400, y: 440, h: 120, id: 'test-exit' });
assert.equal(teleporting.scoring.total, 110, 'Teleport must not collect orbs along its path.');
assert.equal(teleporting.scoring.multiplier, 1, 'Teleporting past missed orbs breaks the chain.');

// The remaining orbs sit above isolated spikes and need only a normal jump.
for (const sequence of [3, 4, 5, 6, 9, 12]) {
  const game = newGame();
  const orb = game.scoring.orbs.find(o => o.sequence === sequence);
  game.level.cameraX = orb.x - 90 - game.player.x;
  game.player.placeAt(WORLD.GROUND_Y - game.player.h);
  game._queueJump();
  for (let frame = 0; frame < 46; frame++) {
    game._update(1);
    assert.equal(game.state, 'playing', `Orb ${sequence} must have a safe normal-jump route.`);
  }
  assert.ok(game.scoring.collected.has(sequence), `Orb ${sequence} must be reachable.`);
}
console.log('Runtime orb routes, scoring lifecycle, and teleport smoke passed.');
