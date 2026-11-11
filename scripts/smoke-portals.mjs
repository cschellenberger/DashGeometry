import assert from 'node:assert/strict';
import { LEVELS } from '../js/level.js';
import { GAMEPLAY } from '../js/config.js';
import { PortalSystem } from '../js/portal.js';
import { LevelBuilder } from '../js/levelBuilder.js';
import { Player } from '../js/player.js';

for (const definition of LEVELS) {
  const portals = definition.data.filter(o => o.type === 'portal');
  for (const entrance of portals.filter(o => o.role === 'entrance')) {
    const system = new PortalSystem(portals);
    const player = new Player();
    const level = { cameraX: entrance.x - player.x };
    player.placeAt(entrance.y + entrance.h - player.h);
    const destination = system.destinationFor(entrance, player, level.cameraX);
    assert.equal(destination?.id, entrance.targetId);
    const before = level.cameraX;
    player.jump();
    system.teleport(player, level, destination);
    assert.ok(level.cameraX > before);
    assert.equal(player.bottom, destination.y + destination.h);
    assert.equal(player.vy, 0);
    assert.equal(player.hasJumped, false);
    assert.equal(player.isGrounded, true);
    assert.equal(system.lockId, destination.id);
    assert.equal(system.cooldownFrames, GAMEPLAY.PORTAL_COOLDOWN_FRAMES);
    assert.equal(system.destinationFor(destination, player, level.cameraX), null, 'Exits never retrigger.');
    assert.ok(definition.data.some(o => ['ground', 'block'].includes(o.type) &&
      o.y === player.bottom && o.x <= player.left + level.cameraX &&
      o.x + o.w >= player.right + level.cameraX), 'The entire player must land on a supporting surface.');

    // While touching the exit, the lock survives cooldown expiry.
    system.beginFrame(GAMEPLAY.PORTAL_COOLDOWN_FRAMES, player, level.cameraX);
    assert.equal(system.cooldownFrames, 0);
    assert.equal(system.lockId, destination.id);
    system.teleport(player, level, destination);
    level.cameraX = entrance.x - player.x;
    player.placeAt(entrance.y + entrance.h - player.h);
    system.beginFrame(1, player, level.cameraX);
    assert.equal(system.lockId, null);
    assert.equal(system.destinationFor(entrance, player, level.cameraX), null, 'Cooldown blocks another entrance.');
    system.beginFrame(GAMEPLAY.PORTAL_COOLDOWN_FRAMES, player, level.cameraX);
    assert.equal(system.destinationFor(entrance, player, level.cameraX), destination);
    player.y = entrance.y - player.h - 1;
    assert.equal(system.destinationFor(entrance, player, level.cameraX), null, 'Passing above an entrance does not teleport.');
    system.reset();
    assert.equal(system.lockId, null);
    assert.equal(system.cooldownFrames, 0);
  }
}

function pairedBuilder() {
  const builder = new LevelBuilder();
  const first = builder.portalPair({ entranceX: 400, exitX: 800 });
  const second = builder.portalPair({ entranceX: 1200, exitX: 1600 });
  return { builder, first, second };
}
const automatic = pairedBuilder();
assert.doesNotThrow(() => automatic.builder.build());
assert.notEqual(automatic.first.entrance.id, automatic.second.entrance.id, 'Unnamed pairs get unique IDs.');

const mismatch = pairedBuilder();
mismatch.first.entrance.targetId = mismatch.second.exit.id;
assert.throws(() => mismatch.builder.build(), /another pair/);
const missing = pairedBuilder();
missing.first.entrance.targetId = 'missing';
assert.throws(() => missing.builder.build(), /missing portal/);
const duplicate = pairedBuilder();
duplicate.second.exit.id = duplicate.first.exit.id;
assert.throws(() => duplicate.builder.build(), /duplicated/);
const orphan = pairedBuilder();
orphan.builder.objects = orphan.builder.objects.filter(o => o !== orphan.first.entrance);
assert.throws(() => orphan.builder.build(), /exactly one paired entrance/);
const badSize = pairedBuilder();
badSize.first.entrance.h = 0;
assert.throws(() => badSize.builder.build(), /invalid dimensions/);
const unsupported = new LevelBuilder();
unsupported.block(800, 2, 1);
unsupported.portalPair({ entranceX: 400, exitX: 800, exitLane: 2 });
assert.throws(() => unsupported.build(), /not fully supported/, 'An exit must support the full player after its placement offset.');
const spike = pairedBuilder();
spike.builder.spike(820);
assert.throws(() => spike.builder.build(), /overlaps a hazard|only .*before hazard/);
console.log('Portal module checks passed for all levels, pairing, cooldowns, locks, and safe exits.');
