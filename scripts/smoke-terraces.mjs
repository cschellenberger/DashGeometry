import assert from 'node:assert/strict';
import { canvas } from './helpers/runtimeHarness.mjs';
import { Game } from '../js/game.js';
import { SKYWARD_TERRACES_LEVEL_ID, LEVELS } from '../js/level.js';
import { ORB_TYPES } from '../js/scoring.js';

// Authored input route: approach each ledge, then jump for its orb or pad.
// Only normal input is queued; no player, score, or camera positions are set.
for (const frameScale of [0.5, 1, 2]) {
  for (const usePortals of [true, false]) {
    const game = new Game(canvas, { levelId: SKYWARD_TERRACES_LEVEL_ID });
    game._render();
    game._restart();
    const blocks = game.level.data.filter(o => o.type === 'block');
    const pads = game.level.data.filter(o => o.type === 'bouncePad');
    assert.equal(blocks.length, 20);
    const jumps = blocks.flatMap(block => {
      const hasPad = pads.some(p => p.y === block.y && p.x >= block.x && p.x < block.x + block.w);
      return [block.x - 85, ...(block.w >= 480 ? [block.x + (hasPad ? 100 : 140)] : [])];
    });
    if (!usePortals) {
      jumps.push(...game.level.data.filter(o => o.type === 'portal' && o.role === 'entrance').map(p => p.x - 90));
    }
    jumps.sort((a, b) => a - b);
    let teleports = 0;
    let bounces = 0;
    for (let frame = 0; frame < 10000 && game.state === 'playing'; frame++) {
      const worldX = game.player.x + game.level.cameraX;
      while (jumps.length && worldX > jumps[0] + 80) jumps.shift();
      if (jumps.length && worldX >= jumps[0] && game.player.isGrounded) {
        jumps.shift();
        game._queueJump();
      }
      const cameraBefore = game.level.cameraX;
      const velocityBefore = game.player.vy;
      game._update(frameScale);
      if (game.level.cameraX - cameraBefore > 10) teleports++;
      if (velocityBefore > 0 && game.player.vy < -15) bounces++;
      if (frame % 60 === 0) game._render();
    }
    assert.equal(game.state, 'win', `Route must finish: frameScale=${frameScale}, portals=${usePortals}`);
    assert.equal(teleports, usePortals ? 2 : 0);
    assert.equal(bounces, 3);
    assert.equal(game.scoring.collected.size, 21);
    assert.equal(game.scoring.missed.size, 0);
    assert.equal(game.scoring.multiplier, 21);
    const expectedScore = game.scoring.orbs.reduce((total, orb) => total + ORB_TYPES[orb.kind].points * orb.sequence, 0);
    assert.equal(game.scoring.total, expectedScore);
    game._render();
    game._restart();
    assert.equal(game.scoring.total, 0);
    assert.equal(game.portals.lockId, null);
    assert.equal(game.portals.cooldownFrames, 0);
    assert.equal(game.portals.byId.size, 4);
    console.log(`Skyward Terraces: ${usePortals ? 'portal' : 'platform'} route, frame scale ${frameScale}, all 21 orbs, ${expectedScore} points.`);
  }
}

const selection = new Game(canvas);
for (let index = 0; index < LEVELS.length; index++) {
  assert.equal(selection.level.id, LEVELS[index].id);
  selection._cycleLevel();
}
assert.equal(selection.level.id, LEVELS[0].id, 'Level cycling wraps through all three levels.');
console.log('Skyward Terraces full-run and level-selection smoke passed.');
