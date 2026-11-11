import assert from 'node:assert/strict';
import { ScoreSystem, validateOrbs } from '../js/scoring.js';
import { LevelBuilder } from '../js/levelBuilder.js';
import { Player } from '../js/player.js';

const builder = new LevelBuilder();
// Author out of order to verify automatic numbering follows the course.
builder.orb(300, 400, 'pink');
builder.orb(100, 400, 'cyan');
builder.orb(200, 400, 'gold');
builder.orb(400, 400, 'cyan');
const orbs = builder.build().data.filter(o => o.type === 'orb').sort((a, b) => a.sequence - b.sequence);
assert.deepEqual(orbs.map(o => o.sequence), [1, 2, 3, 4]);
const score = new ScoreSystem(orbs);
assert.equal(score.collect(orbs[0]), 10);
assert.equal(score.collect(orbs[1]), 50);
assert.equal(score.collect(orbs[2]), 150);
assert.equal(score.total, 210);
assert.equal(score.multiplier, 3);
assert.equal(score.collect(orbs[2]), 0, 'Repeated contact cannot award points twice.');
assert.equal(score.total, 210);

score.reset();
score.collect(orbs[0]);
score.collect(orbs[1]);
score.pass(329);
assert.equal(score.multiplier, 1, 'Missing an orb resets immediately without requiring another pickup.');
assert.equal(score.total, 60, 'Missing an orb preserves earned points.');
assert.equal(score.collect(orbs[2]), 0, 'Passed orbs stay unavailable.');
assert.equal(score.collect(orbs[3]), 10);

score.reset();
score.collect(orbs[0]);
assert.equal(score.collect(orbs[2]), 50, 'Out-of-order pickup starts a fresh chain at x1.');
assert.equal(score.collect(orbs[3]), 20, 'The new chain can grow again.');

score.reset();
const player = new Player();
player.x = orbs[0].x;
player.placeAt(orbs[0].y);
score.update(player, 0);
assert.equal(score.total, 0, 'Grounded contact does not collect.');
player.isGrounded = false;
score.update(player, 0);
assert.equal(score.total, 0, 'Falling without a jump does not collect.');
player.hasJumped = true;
player.x = 0;
score.update(player, 0);
assert.equal(score.total, 0, 'An airborne miss does not collect.');
score.update(player, 100);
assert.equal(score.total, 10, 'Collection uses world coordinates and airborne contact.');
score.update(player, 100);
assert.equal(score.total, 10);

score.reset();
assert.equal(score.total, 0);
assert.equal(score.multiplier, 1);
assert.equal(score.collected.size, 0);
assert.equal(score.missed.size, 0);
assert.equal(orbs.some(o => 'collected' in o || 'missed' in o), false, 'Shared level definitions stay immutable during play.');
assert.throws(() => validateOrbs([{ ...orbs[0], sequence: 2 }]), /sequence numbers/);
assert.throws(() => validateOrbs([{ ...orbs[0], kind: 'unknown' }]), /colour/);
assert.throws(() => validateOrbs([{ ...orbs[0] }, { ...orbs[0], sequence: 2 }]), /unique increasing/);
console.log('Orb scoring smoke passed.');
